import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

// Server-side API route to accept upload bytes and save a PDF file.
// This route is used by the client upload forms in the app. Important notes:
// - This code currently stores files in `public/uploads` which makes them
//   publicly accessible. Use another directory or signed URLs for private
//   storage.
// - No authentication or rate-limiting is enforced here. Add auth in
//   production.
export async function POST(req) {
  try {
    // Read raw bytes from the incoming request body. Using arrayBuffer() is
    // convenient in Next.js route handlers to get the full binary content.
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read filename from custom header set by the client. We decode and use
    // path.basename to avoid directory traversal attacks. However, in a
    // production system you should additionally validate and sanitize names
    // and/or generate server-side unique filenames.
    const rawName = req.headers.get("x-filename") || "upload-" + Date.now() + ".pdf";
    const filename = path.basename(decodeURIComponent(rawName));

    // Ensure extension is present and lowercased
    const ext = path.extname(filename).toLowerCase() || ".pdf";
    const safeFilename = filename.endsWith(ext) ? filename : `${filename}${ext}`;

    // Ensure uploads folder exists (creates recursively if needed)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    // Save the uploaded bytes to disk. This is synchronous in the sense that
    // we await the promise — but it is a simple writeFile operation.
    const filePath = path.join(uploadsDir, safeFilename);
    await fs.promises.writeFile(filePath, buffer);

    // Attempt to extract text from the PDF using `pdf-parse`.
    // Add a quick sanity-check for the PDF header ('%PDF') to avoid passing
    // obviously non-PDF files into the parser (which can trigger internal
    // errors like the TypeError observed in logs). This is a lightweight
    // guard — it doesn't prove the file is a valid PDF, but it filters out
    // many bad inputs and prevents the parser from hitting unexpected
    // internal states.
    let extractedText = "";
    let parseError = null;

    try {
      const header = buffer.slice(0, 4).toString("utf8");
      if (header !== "%PDF") {
        // Not a PDF-like file; skip parsing and return a helpful message so
        // the client can handle it. We still saved the bytes to disk above.
        parseError = "file does not start with %PDF header; skipping pdf-parse";
        console.warn("Upload appears non-PDF (header):", header);
      } else {
        // Header looks like a PDF — try best-effort parsing. Wrap in try/catch
        // to capture and return any parse errors rather than allowing them to
        // surface as unhandled exceptions.
        const parsed = await pdfParse(buffer);
        extractedText = parsed && parsed.text ? parsed.text : "";
      }
    } catch (e) {
      // Capture the parse error and continue — we return the saved file path
      // so the client can still access the uploaded file even if parsing
      // fails. Store a short message in `parseError` for diagnostics.
      console.warn("PDF parse failed:", e);
      parseError = e && e.message ? String(e.message) : String(e);
      extractedText = "";
    }

    const publicPath = `/uploads/${encodeURIComponent(safeFilename)}`;
    // Return a small JSON object describing the saved file and any extracted
    // text. The client can decide how to use this (for example, the chat
    // flow consumes the `text` field to seed a conversation).
    return new Response(
      JSON.stringify({ ok: true, path: publicPath, text: extractedText, parseError }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (err) {
    // Log and return a generic error payload. Avoid leaking sensitive
    // information in error messages for production.
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

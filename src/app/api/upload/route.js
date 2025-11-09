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

    // Attempt to extract text from the PDF using `pdf-parse`. This is
    // best-effort: many PDFs contain selectable text and will return useful
    // output; scanned documents will not return text unless OCR is applied.
    let extractedText = "";
    try {
      const parsed = await pdfParse(buffer);
      extractedText = parsed && parsed.text ? parsed.text : "";
    } catch (e) {
      // Don't fail the entire upload on parse errors; return the file
      // location but keep the extracted text empty.
      console.warn("PDF parse failed:", e);
      extractedText = "";
    }

    const publicPath = `/uploads/${encodeURIComponent(safeFilename)}`;
    // Return a small JSON object describing the saved file and any extracted
    // text. The client can decide how to use this (for example, the chat
    // flow consumes the `text` field to seed a conversation).
    return new Response(
      JSON.stringify({ ok: true, path: publicPath, text: extractedText }),
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

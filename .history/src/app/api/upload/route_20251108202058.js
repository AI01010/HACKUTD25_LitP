import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

export async function POST(req) {
  try {
    // Read raw bytes from request
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read filename header (client sets x-filename)
    const rawName = req.headers.get("x-filename") || "upload-" + Date.now() + ".pdf";
    // Decode and sanitize
    const filename = path.basename(decodeURIComponent(rawName));

    // Ensure extension
    const ext = path.extname(filename).toLowerCase() || ".pdf";
    const safeFilename = filename.endsWith(ext) ? filename : `${filename}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, safeFilename);
    await fs.promises.writeFile(filePath, buffer);

    // try to extract text from PDF (best-effort)
    let extractedText = "";
    try {
      const parsed = await pdfParse(buffer);
      extractedText = parsed && parsed.text ? parsed.text : "";
    } catch (e) {
      console.warn("PDF parse failed:", e);
      extractedText = "";
    }

    const publicPath = `/uploads/${encodeURIComponent(safeFilename)}`;
    return new Response(
      JSON.stringify({ ok: true, path: publicPath, text: extractedText }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

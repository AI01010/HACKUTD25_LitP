import fs from "fs";
import path from "path";

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

    const publicPath = `/uploads/${encodeURIComponent(safeFilename)}`;
    return new Response(JSON.stringify({ ok: true, path: publicPath }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

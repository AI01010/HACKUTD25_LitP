"use client";

// Home / Upload page
// This file implements a simple UI to upload a PDF to the server. It is a
// client-side React component (Next.js "app" router). The UI is intentionally
// minimal: a file input, an upload button, and a small list of example uploaded
// PDFs. The upload is posted as raw bytes to `/api/upload`, which stores the
// file under `public/uploads` and attempts to extract text (server-side).

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  // file: selected File object (from <input type=file />)
  const [file, setFile] = useState(null);
  // uploading: simple flag to disable the UI while the network request runs
  const [uploading, setUploading] = useState(false);
  // message: short status message to show success/error hints to the user
  const [message, setMessage] = useState("");
  // uploadedUrl: public URL returned by the server (if any)
  const [uploadedUrl, setUploadedUrl] = useState("");

  // handleSubmit: basic client-side validation then POST file bytes to the
  // server. The server expects the original filename in the `x-filename`
  // header and raw bytes in the body. We set a content-type header but the
  // server primarily reads the raw body.
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setUploadedUrl("");

    // Basic client-side checks to improve UX (server should re-validate too)
    if (!file) {
      setMessage("Please choose a PDF file.");
      return;
    }
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are accepted.");
      return;
    }

    setUploading(true);
    try {
      // We post the raw File object as the body. The API route will use
      // `req.arrayBuffer()` to read the bytes and save to disk. We also include
      // the filename via a custom header so the server can preserve the name.
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-filename": encodeURIComponent(file.name),
          "content-type": file.type || "application/pdf",
        },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      const data = await res.json();
      // server returns a public path (and may include extracted text in other
      // flows). We keep the URL so user can click to view/download the upload.
      setUploadedUrl(data.path || "");
      setMessage("Upload successful.");
    } catch (err) {
      // Log the error to the browser console for debugging; show a short
      // message to the user.
      console.error(err);
      setMessage("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {/* <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        /> */}
        <div className="mb-8 text-center text-4xl font-bold sm:text-left">
          Welcome to FIN ESTATE
        </div>


        <div className="w-full max-w-lg rounded-md border bg-white dark:bg-[#0b0b0b] p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Upload a PDF</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files && e.target.files[0])}
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded bg-green-600 hover:bg-green-700 px-4 py-2 text-white disabled:opacity-60"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload PDF"}
              </button>
              {message && <span className="text-sm text-zinc-600">{message}</span>}
            </div>
          </form>

          {uploadedUrl && (
            <div className="mt-4 text-sm">
              File saved to: <a className="text-blue-600" href={uploadedUrl}>{uploadedUrl}</a>
            </div>
          )}
        </div>

        {/* show a list of uploaded PDFs */}
        <div className="mt-8">
          <h3 className="mb-2 text-lg font-semibold">Uploaded PDFs</h3>
          <ul className="list-disc list-inside">
            {/* Example list items - replace with actual uploaded files */}
            <li><a className="text-blue-600" href="/uploads/sample1.pdf">sample1.pdf</a></li>
            <li><a className="text-blue-600" href="/uploads/sample2.pdf">sample2.pdf</a></li>
          </ul>
        </div>

        {/* <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 text-white transition-colors hover:bg-green-700 md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div> */}
      </main>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setUploadedUrl("");
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
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        headers: {
          "x-filename": encodeURIComponent(file.name),
          "content-type": file.type || "application/pdf",
        },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      const data = await res.json();
      setUploadedUrl(data.path || "");
      setMessage("Upload successful.");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <div className="w-full max-w-lg rounded-md border bg-primary p-8 shadow-sm">
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
                className="rounded bg-black border border-white px-4 py-2 text-white disabled:opacity-60"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload PDF"}
              </button>
              {message && (
                <span className="text-sm text-zinc-600">{message}</span>
              )}
            </div>
          </form>

          {uploadedUrl && (
            <div className="mt-4 text-sm">
              File saved to:{" "}
              <a className="text-blue-600" href={uploadedUrl}>
                {uploadedUrl}
              </a>
            </div>
          )}
        </div>

        <button
          onClick={async () => {
            try {
              const res = await fetch("http://localhost:5000/");

              if (!res.ok) throw new Error(`Request failed: ${res.statusText}`);

              const data = await res.json();
              console.log(data);
            } catch (err) {
              console.error(err);
            }
          }}
        >
          Click
        </button>
      </main>
    </div>
  );
}

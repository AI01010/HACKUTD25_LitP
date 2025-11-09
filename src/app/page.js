"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Building2,
  Search,
  TrendingUp,
  Zap,
  Target,
  Clock,
} from "lucide-react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setMessage("");
      } else {
        setMessage("Only PDF files are accepted.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("");
      setUploadedUrl("");
    }
  };

  const clearFile = () => {
    setFile(null);
    setMessage("");
    setUploadedUrl("");
  };

  async function handleSubmit() {
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
      setUploadedUrl(data.path || "");
      setMessage("success");
    } catch (err) {
      console.error(err);
      setMessage("error");
    } finally {
      setUploading(false);
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const features = [
    {
      icon: Search,
      title: "Smart Search",
      description: "Query property data instantly with natural language",
    },
    {
      icon: FileText,
      title: "Document Intelligence",
      description: "Extract metrics and clauses from contracts automatically",
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "Identify trends and forecast property performance",
    },
    {
      icon: Target,
      title: "Insight Summarizer",
      description: "Generate actionable summaries for decision-makers",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  CBRE Intelligence Hub
                </h1>
                <p className="text-sm text-gray-600">
                  AI-Powered Real Estate Insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold mb-4">
              Transform Property Data into Actionable Intelligence
            </h2>
            <p className="text-xl text-blue-100 mb-6">
              Upload property reports, contracts, or sustainability documents to
              unlock instant insights, predictions, and summaries powered by
              advanced AI.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                <Clock className="h-4 w-4" />
                <span>Instant Analysis</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                <Target className="h-4 w-4" />
                <span>Explainable Results</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Predictive Insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Upload Section - 2 columns */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Your Documents
              </h3>
              <p className="text-gray-600 mb-6">
                Upload property reports, leases, sustainability plans, or market
                analysis documents
              </p>

              <div>
                {/* Drag and Drop Area */}
                <div
                  className={`relative rounded-xl border-2 border-dashed transition-all ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-gray-50"
                  } p-12 text-center`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    id="file-upload"
                  />

                  {!file ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700 mb-1">
                          Drop your PDF here, or{" "}
                          <label
                            htmlFor="file-upload"
                            className="text-blue-600 hover:text-blue-700 cursor-pointer underline"
                          >
                            browse
                          </label>
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports: Property Reports, Leases, Contracts,
                          Sustainability Documents
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg bg-white border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!file || uploading}
                  className="mt-6 w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-800"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Analyzing Document...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="h-5 w-5" />
                      Analyze with AI
                    </span>
                  )}
                </button>

                {/* Status Messages */}
                {message && (
                  <div
                    className={`mt-4 flex items-center gap-2 rounded-lg p-4 ${
                      message === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {message === "success" ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <div>
                          <p className="font-semibold">Analysis Complete!</p>
                          <p className="text-sm">
                            Your document has been processed and insights are
                            ready.
                          </p>
                        </div>
                      </>
                    ) : message === "error" ? (
                      <>
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">
                          Upload failed. Please try again.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">{message}</span>
                      </>
                    )}
                  </div>
                )}

                {uploadedUrl && (
                  <div className="mt-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Document Processed Successfully
                    </p>
                    <a
                      href={uploadedUrl}
                      className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {uploadedUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features Sidebar - 1 column */}
          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                AI Capabilities
              </h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <feature.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Example Queries
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  "Which properties in Dallas show high energy costs?"
                </p>
                <p className="text-gray-700">
                  "Which leases expire next quarter?"
                </p>
                <p className="text-gray-700">
                  "Summarize sustainability metrics for Building A"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Recent Analyses
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="/uploads/sample1.pdf"
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Dallas Property Report Q4
                </p>
                <p className="text-sm text-gray-500">Analyzed 2 hours ago</p>
              </div>
            </a>
            <a
              href="/uploads/sample2.pdf"
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Sustainability Metrics 2024
                </p>
                <p className="text-sm text-gray-500">Analyzed 5 hours ago</p>
              </div>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-12">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="font-semibold text-gray-900 mb-2">
              Built for CBRE Hackathon Challenge
            </p>
            <p>
              Transforming commercial real estate data into meaningful
              intelligence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

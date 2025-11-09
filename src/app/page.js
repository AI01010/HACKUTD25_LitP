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
  // (Upload UI removed from the main page - uploads are handled in the
  // Chat page and by the Python backend.)

  // Main page no longer contains a direct PDF upload flow. Users should
  // upload PDFs from the Chat page which routes uploads to the Python
  // backend for parsing and storage.

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
      {/* Header
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
      </header> */}

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
          {/* Uploads moved to the Chat page and the Python backend */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload & Analyze in Chat</h3>
              <p className="text-gray-600 mb-6">
                PDF uploads and document analysis are available in the Chat page.
                Open the Chat to upload PDFs — they will be sent to the Python
                backend for parsing and storage.
              </p>
              <a
                href="/chat"
                className="inline-block rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
              >
                Open Chat
              </a>
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

"use client";

import { useState } from "react";
import {
  MessageSquare,
  BarChart3,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-[#00613C] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Transform Property Data into Actionable Intelligence
            </h1>
            <p className="text-2xl text-green-100 mb-10 leading-relaxed">
              Upload property reports, contracts, or sustainability documents to
              unlock instant insights, predictions, and summaries powered by
              advanced AI.
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3 text-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Clock className="h-5 w-5" />
                </div>
                <span>Instant Analysis</span>
              </div>
              <div className="flex items-center gap-3 text-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Target className="h-5 w-5" />
                </div>
                <span>Explainable Results</span>
              </div>
              <div className="flex items-center gap-3 text-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span>Predictive Insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Chat Widget */}
          <a
            href="/chat"
            className="group block bg-white rounded-2xl border-2 border-gray-200 p-12 transition-all hover:border-[#00613C] hover:shadow-2xl"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#00613C] mb-8 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Chat with AI Assistant
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Ask questions, upload documents, and get instant insights from
              your property data using natural language.
            </p>
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#00613C] shrink-0 mt-1" />
                <p className="text-gray-700">
                  Upload PDFs and extract key metrics automatically
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#00613C] shrink-0 mt-1" />
                <p className="text-gray-700">
                  Query across all documents with natural language
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#00613C] shrink-0 mt-1" />
                <p className="text-gray-700">
                  Get explainable answers with source citations
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-[#00613C] font-semibold text-lg group-hover:gap-4 transition-all">
              Start Chatting
              <ArrowRight className="h-5 w-5" />
            </div>
          </a>

          {/* Dashboard Widget */}
          <a
            href="/dashboard"
            className="group block bg-white rounded-2xl border-2 border-gray-200 p-12 transition-all hover:border-[#00613C] hover:shadow-2xl"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#00613C] mb-8 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              View Analytics Dashboard
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Explore predictive analytics, trend insights, and consolidated
              summaries across your property portfolio.
            </p>
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#00613C] shrink-0 mt-1" />
                <p className="text-gray-700">
                  Visualize property performance and sustainability metrics
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#00613C] shrink-0 mt-1" />
                <p className="text-gray-700">
                  Identify trends and predict future outcomes
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#00613C] shrink-0 mt-1" />
                <p className="text-gray-700">
                  Generate reports for stakeholders and decision-makers
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-[#00613C] font-semibold text-lg group-hover:gap-4 transition-all">
              Open Dashboard
              <ArrowRight className="h-5 w-5" />
            </div>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg mb-2">
              Built for CBRE Hackathon Challenge
            </p>
            <p className="text-gray-600">
              Transforming commercial real estate data into meaningful
              intelligence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

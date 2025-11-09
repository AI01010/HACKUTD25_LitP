"use client";

// Site navigation bar
// This component is intentionally small and uses Next.js `Link` components for
// client-side navigation. Styling is done with Tailwind utility classes and a
// couple of CSS custom properties (e.g. --foreground) to make it easy to
// replace colors in one place.

import Link from "next/link";
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

export default function Navbar() {
  return (
    <nav
      className="shadow-md border-b"
      style={{
        // These CSS custom properties are defined in the global stylesheet.
        backgroundColor: "var(--primary-theme-color)",
        borderBottom: "1px solid var(--secondary-theme-color)",
      }}
    >
      <header className="border-b border-gray-300 bg-[#003F2D]/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-8xl px-20 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-800 shadow-lg">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white-900">
                    CBRE Intelligence Hub
                  </h1>
                  <p className="text-sm text-gray-300">
                    AI-Powered Real Estate Insights
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/" className="text-white hover:text-green-300 font-medium">
                  Home
                </Link>
                <Link href="/dashboard" className="text-white hover:text-green-300 font-medium">
                  Dashboard
                </Link>
                <Link href="/chat" className="text-white hover:text-green-300 font-medium">
                  Chat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header> 
    </nav>
  );
}

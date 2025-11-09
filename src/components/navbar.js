"use client";

// Site navigation bar
// This component is intentionally small and uses Next.js `Link` components for
// client-side navigation. Styling is done with Tailwind utility classes and a
// couple of CSS custom properties (e.g. --foreground) to make it easy to
// replace colors in one place.

import Link from "next/link";

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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Brand / home link */}
            <Link href="/" className="font-bold text-xl" style={{ color: "var(--foreground)" }}>
              FIN ESTATE
            </Link>
          </div>

          {/* Center navigation links */}
          <div className="flex items-center space-x-15">
            <Link href="/dashboard" className="hover:underline" style={{ color: "var(--foreground)" }}>
              DASHBOARD
            </Link>
            <Link href="/chat" className="hover:underline" style={{ color: "var(--foreground)" }}>
              CHAT
            </Link>
          </div>

          {/* Right-side links (e.g. about/contact) */}
          <div className="flex items-center space-x-8">
            <Link href="/about_contact" className="hover:underline" style={{ color: "var(--foreground)" }}>
              ABOUT/CONTACT
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

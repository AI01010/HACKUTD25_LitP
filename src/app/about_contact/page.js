
"use client";

// About / Contact page
// This is a small informational page included for demo/navigation purposes.
// It shows how to use `Link` from Next.js to navigate between pages and acts
// as a placeholder for real about/contact content.

import Link from "next/link";

export default function AboutContact() {
	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
			<main className="mx-auto max-w-3xl">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold">About / Contact</h1>
					<div>
						{/* Link back to home — Next.js `Link` handles client-side navigation */}
						<Link href="/" className="text-sm text-blue-600">Home</Link>
					</div>
				</div>

				<section className="rounded-md border bg-white p-6 shadow-sm dark:bg-[#0b0b0b]">
					<h2 className="text-lg font-semibold">About FIN ESTATE</h2>
					<p className="mt-3 text-sm text-gray-600 dark:text-gray-300">This is a demo app for property analytics — sample pages populated for testing. You can upload PDFs from the home page and test the dashboard which shows property metrics.</p>

					<h3 className="mt-4 font-medium">Contact</h3>
					<p className="text-sm text-gray-600 dark:text-gray-300">For testing, use the links in the navbar to navigate. This page is a placeholder for contact info.</p>
				</section>
			</main>
		</div>
	);
}

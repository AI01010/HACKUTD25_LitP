
"use client";

import Link from "next/link";

export default function Chat() {
	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
			<main className="mx-auto max-w-3xl">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold">Chat</h1>
					<div>
						<Link href="/dashboard" className="text-sm text-blue-600">Dashboard</Link>
					</div>
				</div>

				<section className="rounded-md border bg-white p-6 shadow-sm dark:bg-[#0b0b0b]">
					<p className="text-sm text-gray-600 dark:text-gray-300">This is a placeholder chat page for testing navigation and layout. Replace with real chat UI later.</p>
				</section>
			</main>
		</div>
	);
}

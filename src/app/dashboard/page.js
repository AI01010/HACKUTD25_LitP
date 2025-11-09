"use client";

import Link from "next/link";
import GraphBox from "@/components/graphBox";

export default function Dashboard() {
	const sample = {
		propertyValue: "$420,000",
		futureValue: "$485,000",
		updated: "Nov 2025",
		conditions: {
			water: 4,
			electric: 5,
			maintenance: 3,
			cracks: 2,
		},
	};

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
			<main className="mx-auto max-w-5xl">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold">Dashboard</h1>
					<div className="flex gap-3">
						<Link href="/" className="text-sm text-blue-600">Home</Link>
						<Link href="/chat" className="text-sm text-blue-600">Chat</Link>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<GraphBox
						title="Property Value"
						value={sample.propertyValue}
						subtitle={`As of ${sample.updated}`}
						rating={5}
					/>

					<GraphBox
						title="Predicted Future Value"
						value={sample.futureValue}
						subtitle="1-year prediction"
						rating={4}
					/>

					<div className="col-span-1 lg:col-span-1">
						<div className="rounded-md border p-4 shadow-sm bg-white dark:bg-[#0b0b0b]">
							<h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Condition Ratings</h3>
							<div className="mt-3 grid grid-cols-1 gap-3">
								<GraphBox title="Water" value={`${sample.conditions.water}/5`} rating={sample.conditions.water} />
								<GraphBox title="Electric" value={`${sample.conditions.electric}/5`} rating={sample.conditions.electric} />
								<GraphBox title="Maintenance" value={`${sample.conditions.maintenance}/5`} rating={sample.conditions.maintenance} />
								<GraphBox title="Cracks" value={`${sample.conditions.cracks}/5`} rating={sample.conditions.cracks} />
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

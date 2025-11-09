"use client";

// Dashboard page
// This page demonstrates how `GraphBox` components are used to display
// property metrics. In a real application these would be populated from an
// API or derived from user's uploaded PDF data. For demo purposes we use a
// `sample` object defined below.

import Link from "next/link";
import GraphBox from "@/components/graphBox";

export default function Dashboard() {
	// Sample data for the dashboard
	const data = {
		propertyValue: "$420,000",
		futureValue: "$485,000",
		updated: "Nov 2025",
		monthlyTrend: [
			{ label: 'Jun', value: 400000 },
			{ label: 'Jul', value: 405000 },
			{ label: 'Aug', value: 410000 },
			{ label: 'Sep', value: 415000 },
			{ label: 'Oct', value: 420000 },
			{ label: 'Nov', value: 485000 },
		],
		marketShare: [
			{ label: 'Residential', value: 45 },
			{ label: 'Commercial', value: 30 },
			{ label: 'Industrial', value: 25 },
		],
		monthlyRevenue: [
			{ label: 'Rent', value: 3200 },
			{ label: 'Parking', value: 450 },
			{ label: 'Utilities', value: 800 },
			{ label: 'Other', value: 300 },
		],
		conditions: {
			water: 4,
			electric: 5,
			maintenance: 3,
			cracks: 2,
		},
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Header Section */}
			<div className="bg-white text-[#00613C]">
				<div className="mx-auto max-w-7xl px-6 py-3">
					<div className="max-w-4xl">
						<h1 className="text-4xl font-bold mb-1 leading-tight">
							Property Analytics Dashboard
						</h1>
						<p className="text-xl text-green-700 mb-1 leading-relaxed">
							Track performance metrics, market trends, and property conditions in real-time.
						</p>
					</div>
				</div>
			</div>

			<main className="mx-auto max-w-7xl px-6 mt-2">
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Property Value with Line Chart */}
					<div className="lg:col-span-2">
						<GraphBox
							title="Property Value Trend"
							value={data.propertyValue}
							subtitle={`Updated ${data.updated} • Projected growth: +15.5%`}
							type="line"
							data={data.monthlyTrend}
						/>
					</div>

					{/* Future Value Prediction */}
					<div>
						<GraphBox
							title="Predicted Value"
							value={data.futureValue}
							subtitle="1-year forecast"
							type="metric"
							trend="up"
						/>
					</div>

					{/* Market Distribution Pie Chart */}
					<div>
						<GraphBox
							title="Market Distribution"
							value="Property Mix"
							type="pie"
							data={data.marketShare}
						/>
					</div>

					{/* Monthly Revenue Breakdown */}
					<div>
						<GraphBox
							title="Monthly Revenue"
							value="$4,750"
							type="bar"
							data={data.monthlyRevenue}
						/>
					</div>

					{/* Condition Ratings */}
					<div>
						<div className="rounded-2xl border-2 border-gray-200 p-6 shadow-sm bg-white">
							<h3 className="text-base font-medium text-gray-900 mb-4">Property Conditions</h3>
							<div className="space-y-4">
								<GraphBox 
									title="Water Systems" 
									value={`${data.conditions.water}/5`} 
									type="rating"
									rating={data.conditions.water} 
								/>
								<GraphBox 
									title="Electrical Systems" 
									value={`${data.conditions.electric}/5`} 
									type="rating"
									rating={data.conditions.electric} 
								/>
								<GraphBox 
									title="Maintenance" 
									value={`${data.conditions.maintenance}/5`} 
									type="rating"
									rating={data.conditions.maintenance} 
								/>
								<GraphBox 
									title="Structural Integrity" 
									value={`${data.conditions.cracks}/5`} 
									type="rating"
									rating={data.conditions.cracks} 
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="flex justify-center gap-6 py-8">
					<Link 
						href="/chat" 
						className="inline-flex items-center gap-2 text-[#00613C] font-semibold hover:text-[#00613C]/80 transition-colors"
					>
						Open Chat Assistant
					</Link>
					<Link 
						href="/" 
						className="inline-flex items-center gap-2 text-[#00613C] font-semibold hover:text-[#00613C]/80 transition-colors"
					>
						Return Home
					</Link>
				</div>
			</main>
		</div>
	);
}

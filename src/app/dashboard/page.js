"use client";

// Dashboard page
// This page demonstrates how `GraphBox` components are used to display
// property metrics. In a real application these would be populated from an
// API or derived from user's uploaded PDF data. For demo purposes we use a
// `sample` object defined below.

import { useState } from "react";
import Link from "next/link";
import GraphBox from "@/components/graphBox";
import { Upload } from 'lucide-react';

export default function Dashboard() {
	const [uploadedDocs, setUploadedDocs] = useState([]);
	
	const handleFileUpload = (event) => {
		const files = Array.from(event.target.files);
		const newDocs = files.map(file => ({
			id: Math.random().toString(36).substr(2, 9),
			name: file.name,
			size: (file.size / 1024 / 1024).toFixed(2), // Convert to MB
			date: new Date().toLocaleDateString(),
			type: file.type
		}));
		setUploadedDocs(prev => [...prev, ...newDocs]);
	};

	// Sample data for the dashboard
	const data = {
		propertyValue: "$420,000",
		futureValue: "$485,000",
		updated: "Nov 2025",
		monthlyTrend: [
			{ label: 'Jan', value: 380000 },
			{ label: 'Feb', value: 385000 },
			{ label: 'Mar', value: 390000 },
			{ label: 'Apr', value: 395000 },
			{ label: 'May', value: 398000 },
			{ label: 'Jun', value: 400000 },
			{ label: 'Jul', value: 405000 },
			{ label: 'Aug', value: 410000 },
			{ label: 'Sep', value: 415000 },
			{ label: 'Oct', value: 420000 },
			{ label: 'Nov', value: 485000 },
			{ label: 'Dec', value: 490000 }, // Projected
		],
		marketShare: [
			{ label: 'Residential', value: 45 },
			{ label: 'Commercial', value: 30 },
			{ label: 'Industrial', value: 15 },
			{ label: 'Mixed Use', value: 10 },
		],
		monthlyRevenue: [
			{ label: 'Base Rent', value: 3200 },
			{ label: 'Parking', value: 450 },
			{ label: 'Utilities', value: 800 },
			{ label: 'Storage', value: 200 },
			{ label: 'Pet Rent', value: 150 },
			{ label: 'Amenities', value: 100 },
			{ label: 'Other', value: 100 },
		],
		conditions: {
			water: 4,
			electric: 5,
			maintenance: 3,
			cracks: 2,
			hvac: 4,
			security: 5,
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
								<GraphBox 
									title="HVAC Systems" 
									value={`${data.conditions.hvac}/5`} 
									type="rating"
									rating={data.conditions.hvac} 
								/>
								<GraphBox 
									title="Security Systems" 
									value={`${data.conditions.security}/5`} 
									type="rating"
									rating={data.conditions.security} 
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Document Upload Section */}
				<div className="mt-8 rounded-2xl border-2 border-gray-200 p-6 shadow-sm bg-white">
					<h3 className="text-base font-medium text-gray-900 mb-4">Document Management</h3>
					
					{/* Upload Button */}
					<div className="flex items-center justify-center w-full">
						<label htmlFor="file-upload" className="relative cursor-pointer">
							<div className="group flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-[#00613C]/30 bg-white hover:bg-[#00613C]/5 transition-all">
								<div className="flex flex-col items-center justify-center pt-5 pb-6">
									<Upload className="w-10 h-10 mb-3 text-[#00613C]/70 group-hover:text-[#00613C]" />
									<p className="mb-2 text-sm text-[#00613C]/70 group-hover:text-[#00613C]">
										<span className="font-semibold">Click to upload</span> or drag and drop
									</p>
									<p className="text-xs text-gray-500">PDF, DOC, DOCX (MAX. 10MB)</p>
								</div>
							</div>
							<input 
								id="file-upload" 
								type="file" 
								className="hidden" 
								onChange={handleFileUpload}
								multiple
								accept=".pdf,.doc,.docx"
							/>
						</label>
					</div>

					{/* Uploaded Documents List */}
					{uploadedDocs.length > 0 && (
						<div className="mt-6">
							<h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Documents</h4>
							<div className="space-y-2">
								{uploadedDocs.map(doc => (
									<div 
										key={doc.id} 
										className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-lg bg-[#00613C]/10 flex items-center justify-center">
												<span className="text-xs font-medium text-[#00613C]">
													{doc.type.split('/')[1]?.toUpperCase() || 'DOC'}
												</span>
											</div>
											<div>
												<p className="text-sm font-medium text-gray-900">{doc.name}</p>
												<p className="text-xs text-gray-500">{doc.size} MB • Uploaded {doc.date}</p>
											</div>
										</div>
										<button 
											onClick={() => setUploadedDocs(prev => prev.filter(d => d.id !== doc.id))}
											className="text-gray-400 hover:text-red-500 transition-colors"
										>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								))}
							</div>
						</div>
					)}
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
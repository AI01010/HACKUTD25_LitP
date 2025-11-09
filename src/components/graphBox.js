
"use client";

// GraphBox: small presentational component used on the dashboard to show a
// metric (title + value) and a tiny 5-segment visual representation of a
// rating (e.g. condition 0..5). This component is intentionally simple and
// purely presentational — if you need interactivity or charts, create a
// dedicated component.
export default function GraphBox({ title, value, subtitle, rating = 0 }) {
	// rating expected 0..5; normalize to integer within that range
	const normalized = Math.max(0, Math.min(5, Math.round(rating)));

	return (
		<div className="rounded-md border p-4 shadow-sm bg-white dark:bg-[#0b0b0b] w-full">
			<div className="flex items-start justify-between">
				<div>
					{/* Title and numeric value */}
					<h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</h3>
					<div className="mt-1 text-2xl font-semibold text-black dark:text-white">{value}</div>
					{subtitle && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>}
				</div>
			</div>

			{/* Small visual indicator for condition: five equal-width bars */}
			<div className="mt-4">
				<div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Condition</div>
				<div className="flex items-center gap-1">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className={`h-2 flex-1 rounded-sm ${i < normalized ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}
						/>
					))}
				</div>
			</div>
		</div>
	);
}


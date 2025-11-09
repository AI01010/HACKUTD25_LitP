
"use client";

import { BarChart, PieChart, LineChart } from 'lucide-react';

// GraphBox: Enhanced component that can display various types of metrics and charts
export default function GraphBox({ 
  title, 
  value, 
  subtitle, 
  rating = 0,
  type = 'metric', // 'metric', 'bar', 'line', 'pie', 'rating'
  data = null, // For charts: [{label: string, value: number}]
  trend = null, // 'up' | 'down' | null
  color = '#00613C'
}) {
  const normalized = Math.max(0, Math.min(5, Math.round(rating)));

  // Helper to render different chart types
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <div className="h-24 mt-4 flex items-end gap-2">
            {data?.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-[#00613C]/90 rounded-sm transition-all hover:bg-[#00613C]" 
                  style={{ height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                />
                <span className="text-xs text-gray-500 truncate w-full text-center">{item.label}</span>
              </div>
            ))}
          </div>
        );
      
      case 'pie':
        return (
          <div className="h-24 mt-4 flex justify-center">
            <div className="relative w-24 h-24">
              {data?.map((item, i) => {
                const total = data.reduce((sum, d) => sum + d.value, 0);
                const percentage = (item.value / total) * 100;
                const rotate = data.slice(0, i).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                return (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(${color} ${percentage}%, transparent ${percentage}%)`,
                      transform: `rotate(${rotate}deg)`,
                      borderRadius: '50%',
                      opacity: 0.9
                    }}
                  />
                );
              })}
            </div>
          </div>
        );

      case 'line':
        return (
          <div className="h-24 mt-4">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {data?.map((item, i, arr) => {
                if (i === arr.length - 1) return null;
                const x1 = (i / (arr.length - 1)) * 100;
                const x2 = ((i + 1) / (arr.length - 1)) * 100;
                const y1 = 100 - (item.value / Math.max(...arr.map(d => d.value))) * 100;
                const y2 = 100 - (arr[i + 1].value / Math.max(...arr.map(d => d.value))) * 100;
                return (
                  <line
                    key={i}
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    stroke={color}
                    strokeWidth="2"
                    className="transition-all hover:stroke-[#00613C]"
                  />
                );
              })}
            </svg>
          </div>
        );

      case 'rating':
        return (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">Condition</div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    i < normalized 
                      ? 'bg-[#00613C] hover:bg-[#00613C]/90' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border-2 border-gray-200 p-6 shadow-sm bg-white hover:border-[#00613C]/20 transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            {title}
            {type !== 'metric' && (
              <span className="text-[#00613C]/70">
                {type === 'bar' && <BarChart size={16} />}
                {type === 'pie' && <PieChart size={16} />}
                {type === 'line' && <LineChart size={16} />}
              </span>
            )}
          </h3>
          <div className="mt-2 text-3xl font-semibold text-[#00613C]">{value}</div>
          {subtitle && (
            <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
          )}
        </div>
      </div>

      {renderChart()}
    </div>
  );
}


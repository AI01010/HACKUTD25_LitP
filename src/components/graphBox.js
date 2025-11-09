
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
          <div className="h-32 mt-4">
            <div className="h-28 flex items-end gap-1.5 pb-6 relative">
              {data?.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    ${item.value.toLocaleString()}
                  </div>
                  <div 
                    className="w-full bg-[#00613C]/80 rounded-t transition-all group-hover:bg-[#00613C] relative"
                    style={{ height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                  />
                  <span className="text-xs text-gray-600 absolute bottom-0 transform -rotate-45 origin-top-left ml-2">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'pie':
        return (
          <div className="mt-4 flex items-center justify-between">
            <div className="relative w-24 h-24">
              {data?.map((item, i) => {
                const total = data.reduce((sum, d) => sum + d.value, 0);
                const percentage = (item.value / total) * 100;
                const rotate = data.slice(0, i).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                const colors = ['#00613C', '#007a4d', '#00945e', '#00ad6f', '#00c780'];
                return (
                  <div
                    key={i}
                    className="absolute inset-0 transition-transform hover:scale-105 cursor-pointer group"
                    style={{
                      background: `conic-gradient(${colors[i % colors.length]} ${percentage}%, transparent ${percentage}%)`,
                      transform: `rotate(${rotate}deg)`,
                      borderRadius: '50%',
                    }}
                  >
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {item.label}: {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              {data?.map((item, i) => {
                const total = data.reduce((sum, d) => sum + d.value, 0);
                const percentage = (item.value / total) * 100;
                const colors = ['#00613C', '#007a4d', '#00945e', '#00ad6f', '#00c780'];
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="text-gray-600">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'line':
        return (
          <div className="h-32 mt-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-500">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="border-t border-gray-100 w-full h-0" />
              ))}
            </div>
            <svg className="w-full h-full relative z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={data?.map((item, i, arr) => {
                  const x = (i / (arr.length - 1)) * 100;
                  const y = 100 - (item.value / Math.max(...arr.map(d => d.value))) * 100;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ') + ` L 100 100 L 0 100 Z`}
                fill="url(#lineGradient)"
              />
              {data?.map((item, i, arr) => {
                if (i === arr.length - 1) return null;
                const x1 = (i / (arr.length - 1)) * 100;
                const x2 = ((i + 1) / (arr.length - 1)) * 100;
                const y1 = 100 - (item.value / Math.max(...arr.map(d => d.value))) * 100;
                const y2 = 100 - (arr[i + 1].value / Math.max(...arr.map(d => d.value))) * 100;
                return (
                  <g key={i}>
                    <line
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke={color}
                      strokeWidth="2"
                      className="transition-all"
                    />
                    <circle
                      cx={`${x1}%`}
                      cy={`${y1}%`}
                      r="2"
                      fill={color}
                      className="transition-all hover:r-3"
                    >
                      <title>${item.value.toLocaleString()}</title>
                    </circle>
                  </g>
                );
              })}
              <circle
                cx="100%"
                cy={`${100 - (data[data.length - 1].value / Math.max(...data.map(d => d.value))) * 100}%`}
                r="2"
                fill={color}
                className="transition-all hover:r-3"
              >
                <title>${data[data.length - 1].value.toLocaleString()}</title>
              </circle>
            </svg>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              {data?.map((item, i) => (
                <div key={i} className="transform -rotate-45 origin-top-left">{item.label}</div>
              ))}
            </div>
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
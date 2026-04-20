'use client';

import { CompletionsLineChart } from '@/components/charts/completions-line-chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const PAYOUT_WEIGHTS = [
  { name: 'Completions', value: 50, color: '#00E5CC' },
  { name: 'Time spent', value: 30, color: '#00d2ff' },
  { name: 'Engagement', value: 20, color: '#ffab00' },
];

interface CreatorChartsProps {
  data7d?: { date: string; completions: number }[];
  data30d?: { date: string; completions: number }[];
  data90d?: { date: string; completions: number }[];
  donut?: boolean;
  totalEarnings?: number;
}

export function CreatorCharts({ data7d, data30d, data90d, donut, totalEarnings = 0 }: CreatorChartsProps) {
  if (donut) {
    const formatted = totalEarnings >= 1000
      ? `$${(totalEarnings / 1000).toFixed(1)}K`
      : `$${totalEarnings.toFixed(0)}`;

    return (
      <div>
        {/* Donut with center label */}
        <div className="relative w-[180px] h-[180px] mx-auto mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PAYOUT_WEIGHTS}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                strokeWidth={0}
                startAngle={90}
                endAngle={-270}
              >
                {PAYOUT_WEIGHTS.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{formatted}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5">
          {PAYOUT_WEIGHTS.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-[#a0a0b8]">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <CompletionsLineChart
      data7d={data7d || []}
      data30d={data30d || []}
      data90d={data90d || []}
    />
  );
}

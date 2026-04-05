'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface CompletionsLineChartProps {
  data7d: { date: string; completions: number }[];
  data30d: { date: string; completions: number }[];
  data90d: { date: string; completions: number }[];
}

type Period = '7D' | '30D' | '90D';

export function CompletionsLineChart({ data7d, data30d, data90d }: CompletionsLineChartProps) {
  const [period, setPeriod] = useState<Period>('7D');

  const dataMap: Record<Period, { date: string; completions: number }[]> = {
    '7D': data7d,
    '30D': data30d,
    '90D': data90d,
  };

  const data = dataMap[period];

  return (
    <div>
      {/* Period Toggle */}
      <div className="flex items-center gap-1 mb-4">
        {(['7D', '30D', '90D'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              period === p
                ? 'bg-[#B4F000] text-[#0A0A0A]'
                : 'border border-[#2A2A2A] text-[#888888] hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1E1E1E" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#555555', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#555555', fontSize: 11 }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#141414',
                border: '1px solid #1E1E1E',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="completions"
              stroke="#B4F000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#B4F000' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

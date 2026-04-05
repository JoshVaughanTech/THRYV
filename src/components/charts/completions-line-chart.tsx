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
                ? 'bg-[#6c5ce7] text-white'
                : 'border border-[#2a2a3a] text-[#a0a0b8] hover:text-white'
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
            <CartesianGrid stroke="#2a2a3a" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b6b80', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b6b80', fontSize: 11 }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#15151f',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="completions"
              stroke="#6c5ce7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#6c5ce7' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

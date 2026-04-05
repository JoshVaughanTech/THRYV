'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MomentumBarChartProps {
  data: { day: string; points: number }[];
}

export function MomentumBarChart({ data }: MomentumBarChartProps) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="20%">
          <XAxis
            dataKey="day"
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
            cursor={{ fill: 'rgba(180, 240, 0, 0.05)' }}
          />
          <Bar dataKey="points" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

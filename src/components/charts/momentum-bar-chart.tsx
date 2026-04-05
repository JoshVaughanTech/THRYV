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
            cursor={{ fill: 'rgba(180, 240, 0, 0.05)' }}
          />
          <Bar dataKey="points" fill="#B4F000" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

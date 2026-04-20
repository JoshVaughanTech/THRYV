'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface VolumeChartProps {
  data: { week: string; volume: number; workouts: number; duration: number }[];
  metric: 'volume' | 'workouts' | 'duration';
}

const metricConfig = {
  volume: { key: 'volume', color: '#00E5CC', label: 'Volume (lb)', format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString() },
  workouts: { key: 'workouts', color: '#00d2ff', label: 'Workouts', format: (v: number) => v.toString() },
  duration: { key: 'duration', color: '#ffab00', label: 'Duration (min)', format: (v: number) => `${v}m` },
};

export function VolumeChart({ data, metric }: VolumeChartProps) {
  const config = metricConfig[metric];

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={config.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a2a3a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b6b80', fontSize: 10 }}
            interval={1}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b6b80', fontSize: 10 }}
            width={40}
            tickFormatter={config.format}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#15151f',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '12px',
            }}
            formatter={(value: unknown) => [config.format(Number(value)), config.label]}
            labelStyle={{ color: '#6b6b80' }}
          />
          <Area
            type="monotone"
            dataKey={config.key}
            stroke={config.color}
            strokeWidth={2}
            fill={`url(#gradient-${metric})`}
            dot={false}
            activeDot={{ r: 4, fill: config.color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

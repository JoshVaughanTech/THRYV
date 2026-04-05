'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const PAYOUT_WEIGHTS = [
  { name: 'Completions', value: 50, color: '#B4F000' },
  { name: 'Time Spent', value: 30, color: '#7ED957' },
  { name: 'Engagement', value: 20, color: '#7799DD' },
];

export function EarningsDonutChart() {
  return (
    <div className="flex items-center gap-6">
      <div className="w-[140px] h-[140px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={PAYOUT_WEIGHTS}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={62}
              dataKey="value"
              strokeWidth={0}
            >
              {PAYOUT_WEIGHTS.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">
        {PAYOUT_WEIGHTS.map((item) => (
          <div key={item.name} className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-sm font-medium text-text-primary">{item.value}%</p>
              <p className="text-xs text-text-muted">{item.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

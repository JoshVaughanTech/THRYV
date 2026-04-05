'use client';

import { CompletionsLineChart } from '@/components/charts/completions-line-chart';
import { EarningsDonutChart } from '@/components/charts/earnings-donut-chart';

interface CreatorChartsProps {
  data7d?: { date: string; completions: number }[];
  data30d?: { date: string; completions: number }[];
  data90d?: { date: string; completions: number }[];
  donut?: boolean;
}

export function CreatorCharts({ data7d, data30d, data90d, donut }: CreatorChartsProps) {
  if (donut) {
    return <EarningsDonutChart />;
  }

  return (
    <CompletionsLineChart
      data7d={data7d || []}
      data30d={data30d || []}
      data90d={data90d || []}
    />
  );
}

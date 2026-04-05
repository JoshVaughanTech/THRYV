'use client';

import { DualProgressRing } from '@/components/charts/progress-ring';
import { MomentumBarChart } from '@/components/charts/momentum-bar-chart';

interface ProfileChartsProps {
  workoutPct: number;
  consistencyPct: number;
  avgPerWeek: number;
  consistencyDays: number;
  dailyMomentum: { day: string; points: number }[];
}

export function ProfileCharts({
  workoutPct,
  consistencyPct,
  avgPerWeek,
  consistencyDays,
  dailyMomentum,
}: ProfileChartsProps) {
  return (
    <div className="space-y-6">
      <DualProgressRing
        outerPercentage={workoutPct}
        outerLabel="Workouts"
        outerValue={`${avgPerWeek}/wk`}
        innerPercentage={consistencyPct}
        innerLabel="Consistency"
        innerValue={`${consistencyDays}/7 days`}
      />
      <div>
        <p className="text-xs text-text-muted uppercase tracking-[1px] mb-2 text-center">Daily Momentum</p>
        <MomentumBarChart data={dailyMomentum} />
      </div>
    </div>
  );
}

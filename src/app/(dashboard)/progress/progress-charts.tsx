'use client';

import { useState } from 'react';
import { DualProgressRing } from '@/components/charts/progress-ring';
import { MomentumBarChart } from '@/components/charts/momentum-bar-chart';
import { Card } from '@/components/ui/card';
import { Zap, Sun, Clock, TrendingUp } from 'lucide-react';

type TimeRange = 'WEEK' | 'MONTH' | 'ALL';

interface ProgressChartsProps {
  workoutPct: number;
  consistencyPct: number;
  avgPerWeek: number;
  consistencyDays: number;
  dailyMomentum: { day: string; points: number }[];
  momentum: number;
  momentumLevel: number;
  currentStreak: number;
  longestStreak: number;
  hrsPerWeek: number;
  totalWorkouts: number;
  nextLevelProgress: number;
  nextLevelTotal: number;
  pointsToNextLevel: number;
}

function TimeRangeToggle({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  const options: TimeRange[] = ['WEEK', 'MONTH', 'ALL'];
  return (
    <div className="flex rounded-lg bg-[#141414] border border-[#1E1E1E] p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors tracking-wide ${
            value === opt
              ? 'bg-[#1E1E1E] text-white'
              : 'text-[#555555] hover:text-[#999999]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function ProgressCharts({
  workoutPct,
  consistencyPct,
  avgPerWeek,
  consistencyDays,
  dailyMomentum,
  momentum,
  momentumLevel,
  currentStreak,
  longestStreak,
  hrsPerWeek,
  totalWorkouts,
  nextLevelProgress,
  nextLevelTotal,
  pointsToNextLevel,
}: ProgressChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('WEEK');

  // Trend percentage placeholder (could be computed from data)
  const trendPct = totalWorkouts > 0 ? '+12%' : '0%';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Dual Progress Ring */}
      <Card className="flex flex-col items-center py-8">
        <div className="relative">
          <DualProgressRing
            outerPercentage={workoutPct}
            outerColor="#B4F000"
            outerLabel="Workouts"
            outerValue={`${avgPerWeek}/wk`}
            innerPercentage={consistencyPct}
            innerColor="#7ED957"
            innerLabel="Consistency"
            innerValue={`${consistencyDays}/7 days`}
            size={180}
          />
          {/* Center overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ marginBottom: '28px' }}
          >
            <span className="text-2xl font-bold text-white">{workoutPct}%</span>
            <span className="text-[10px] text-[#555555] uppercase tracking-[1px]">
              Weekly goal
            </span>
          </div>
        </div>
      </Card>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Momentum */}
        <Card className="text-center py-4 px-2">
          <div className="w-9 h-9 rounded-lg bg-[#B4F000]/10 flex items-center justify-center mx-auto mb-2">
            <Zap className="h-4 w-4" style={{ color: '#B4F000' }} />
          </div>
          <p className="text-xl font-bold text-white">{momentum}</p>
          <p className="text-[9px] text-[#555555] uppercase tracking-[1.5px] mt-0.5">
            Momentum
          </p>
          <span className="inline-block mt-2 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-[#1A2A0A] text-[#B4F000]">
            LEVEL {momentumLevel}
          </span>
        </Card>

        {/* Day Streak */}
        <Card className="text-center py-4 px-2">
          <div className="w-9 h-9 rounded-lg bg-[#F0A000]/10 flex items-center justify-center mx-auto mb-2">
            <Sun className="h-4 w-4" style={{ color: '#F0A000' }} />
          </div>
          <p className="text-xl font-bold text-white">{currentStreak}</p>
          <p className="text-[9px] text-[#555555] uppercase tracking-[1.5px] mt-0.5">
            Day Streak
          </p>
          <span className="inline-block mt-2 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-[#1A1400] text-[#F0A000]">
            BEST: {longestStreak}
          </span>
        </Card>

        {/* Hours / Week */}
        <Card className="text-center py-4 px-2">
          <div className="w-9 h-9 rounded-lg bg-[#7799DD]/10 flex items-center justify-center mx-auto mb-2">
            <Clock className="h-4 w-4" style={{ color: '#7799DD' }} />
          </div>
          <p className="text-xl font-bold text-white">{hrsPerWeek}</p>
          <p className="text-[9px] text-[#555555] uppercase tracking-[1.5px] mt-0.5">
            Hrs / Week
          </p>
          <span className="inline-block mt-2 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-[#0A1A2A] text-[#7799DD]">
            {trendPct}
          </span>
        </Card>
      </div>

      {/* Momentum Bar Chart */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4" style={{ color: '#B4F000' }} />
          <h3 className="text-[11px] font-semibold text-[#555555] uppercase tracking-[1.5px]">
            Momentum This Week
          </h3>
        </div>
        <MomentumBarChart data={dailyMomentum} />
      </Card>

      {/* Level Progress */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Level {momentumLevel}</h3>
          <span className="text-sm text-[#999999]">
            {nextLevelProgress.toLocaleString()} / {nextLevelTotal.toLocaleString()}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-[#1E1E1E] overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(100, (nextLevelProgress / (nextLevelTotal || 1)) * 100)}%`,
              background: 'linear-gradient(90deg, #7ED957, #B4F000)',
            }}
          />
        </div>
        <p className="text-xs text-[#555555]">
          {pointsToNextLevel} momentum to Level {momentumLevel + 1}
        </p>
      </Card>
    </div>
  );
}

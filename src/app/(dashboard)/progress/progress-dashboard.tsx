'use client';

import { useState } from 'react';
import {
  Zap,
  Flame,
  Trophy,
  Dumbbell,
  Clock,
  TrendingUp,
  Target,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MomentumBarChart } from '@/components/charts/momentum-bar-chart';
import { VolumeChart } from './volume-chart';
import { WorkoutHeatmap } from './workout-heatmap';
import Link from 'next/link';

interface PRData {
  name: string;
  best1rm: number;
  bestWeight: number;
  bestReps: number;
  achievedAt: string;
  history: { date: string; estimated_1rm: number }[];
}

interface ProgressDashboardProps {
  totalSessions: number;
  totalVolume: number;
  totalDuration: number;
  totalPRs: number;
  programsActive: number;
  programsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  momentum: number;
  momentumLevel: number;
  nextLevelTotal: number;
  pointsToNext: number;
  dailyMomentum: { day: string; points: number }[];
  weeklyVolume: { week: string; volume: number; workouts: number; duration: number }[];
  heatmapData: { date: string; count: number }[];
  topPRs: PRData[];
  consistencyLast7: number;
  consistencyLast30: number;
  memberSince: string;
}

function formatVolume(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString();
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
}

export function ProgressDashboard({
  totalSessions,
  totalVolume,
  totalDuration,
  totalPRs,
  programsActive,
  programsCompleted,
  currentStreak,
  longestStreak,
  momentum,
  momentumLevel,
  nextLevelTotal,
  pointsToNext,
  dailyMomentum,
  weeklyVolume,
  heatmapData,
  topPRs,
  consistencyLast7,
  consistencyLast30,
  memberSince,
}: ProgressDashboardProps) {
  const [volumeMetric, setVolumeMetric] = useState<'volume' | 'workouts' | 'duration'>('volume');

  const memberDays = daysSince(memberSince);
  const memberWeeks = Math.max(1, Math.ceil(memberDays / 7));
  const avgPerWeek = Math.round((totalSessions / memberWeeks) * 10) / 10;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <p className="text-sm text-[#6b6b80] mt-1">
          {memberDays} days training &middot; {avgPerWeek} workouts/week avg
        </p>
      </div>

      {/* Hero Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Dumbbell className="h-4 w-4" />}
          iconBg="bg-[#00E5CC]/10"
          iconColor="#00E5CC"
          value={totalSessions.toString()}
          label="Workouts"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          iconBg="bg-[#00d2ff]/10"
          iconColor="#00d2ff"
          value={`${formatVolume(totalVolume)} lb`}
          label="Total Volume"
        />
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          iconBg="bg-[#ffab00]/10"
          iconColor="#ffab00"
          value={currentStreak.toString()}
          label="Day Streak"
          sub={`Best: ${longestStreak}`}
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          iconBg="bg-[#ff6b6b]/10"
          iconColor="#ff6b6b"
          value={totalPRs.toString()}
          label="PRs Set"
        />
      </div>

      {/* Workout Heatmap */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#00E5CC]" />
            <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px]">
              Activity
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#6b6b80]">
            <span>{consistencyLast7}/7 this week</span>
            <span>{consistencyLast30}/30 this month</span>
          </div>
        </div>
        <WorkoutHeatmap data={heatmapData} />
      </Card>

      {/* Volume / Workouts / Duration Chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#00E5CC]" />
            <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px]">
              Weekly Trends
            </h3>
          </div>
          <div className="flex rounded-lg bg-[#15151f] border border-[#2a2a3a] p-0.5">
            {(['volume', 'workouts', 'duration'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setVolumeMetric(m)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors capitalize cursor-pointer ${
                  volumeMetric === m
                    ? 'bg-[#2a2a3a] text-white'
                    : 'text-[#6b6b80] hover:text-[#a0a0b8]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <VolumeChart data={weeklyVolume} metric={volumeMetric} />
      </Card>

      {/* Momentum Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Momentum Level */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#00E5CC]" />
            <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px]">
              Momentum
            </h3>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-white">{momentum.toLocaleString()}</span>
            <span className="text-sm font-semibold text-[#00E5CC]">Level {momentumLevel}</span>
          </div>
          <div className="h-2 rounded-full bg-[#2a2a3a] overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, (momentum / (nextLevelTotal || 1)) * 100)}%`,
                background: 'linear-gradient(90deg, #00d2ff, #00E5CC)',
              }}
            />
          </div>
          <p className="text-xs text-[#6b6b80]">{pointsToNext} to Level {momentumLevel + 1}</p>
        </Card>

        {/* Daily Momentum Bar Chart */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#00E5CC]" />
            <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px]">
              This Week
            </h3>
          </div>
          <MomentumBarChart data={dailyMomentum} />
        </Card>
      </div>

      {/* Personal Records */}
      {topPRs.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#ffab00]" />
              <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px]">
                Top Personal Records
              </h3>
            </div>
            <Link
              href="/records"
              className="text-xs text-[#00E5CC] hover:text-[#00CCBB] transition-colors flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topPRs.map((pr) => {
              const recent = daysSince(pr.achievedAt) <= 7;
              const improved = pr.history.length > 1;
              const prevBest = improved
                ? pr.history
                    .slice(0, -1)
                    .reduce((max, h) => Math.max(max, h.estimated_1rm), 0)
                : 0;
              const improvement = improved && prevBest > 0
                ? Math.round(((pr.best1rm - prevBest) / prevBest) * 100)
                : 0;

              return (
                <div
                  key={pr.name}
                  className={`rounded-xl border p-3 transition-colors ${
                    recent
                      ? 'border-[#00E5CC]/40 bg-[#00E5CC]/5'
                      : 'border-[#2a2a3a] bg-[#15151f]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[13px] font-semibold text-white truncate flex-1 mr-2">
                      {pr.name}
                    </p>
                    {recent && (
                      <span className="text-[9px] font-bold text-[#00E5CC] uppercase bg-[#00E5CC]/10 px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-white">{pr.bestWeight}</span>
                    <span className="text-[11px] text-[#6b6b80]">lb</span>
                    <span className="text-[11px] text-[#6b6b80] mx-0.5">&times;</span>
                    <span className="text-lg font-bold text-[#ffab00]">{pr.bestReps}</span>
                    <span className="text-[11px] text-[#6b6b80]">reps</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-[#6b6b80]">
                      Est. 1RM: {Math.round(pr.best1rm)} lb
                    </span>
                    {improvement > 0 && (
                      <span className="text-[10px] font-semibold text-green-400">
                        +{improvement}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Programs Summary */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-[#00E5CC]" />
          <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px]">
            Programs
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#00E5CC]">{programsActive}</p>
            <p className="text-[11px] text-[#6b6b80] mt-0.5">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{programsCompleted}</p>
            <p className="text-[11px] text-[#6b6b80] mt-0.5">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{formatDuration(totalDuration)}</p>
            <p className="text-[11px] text-[#6b6b80] mt-0.5">Total Time</p>
          </div>
        </div>
      </Card>

      {/* Empty state for brand new users */}
      {totalSessions === 0 && (
        <div className="text-center py-8">
          <Dumbbell className="h-10 w-10 text-[#4a4a5a] mx-auto mb-3" />
          <p className="text-sm text-[#a0a0b8] mb-1">No workout data yet</p>
          <p className="text-xs text-[#6b6b80]">
            Complete your first workout to start tracking progress
          </p>
          <Link
            href="/programs"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-[#00E5CC] text-white text-sm font-medium hover:bg-[#00CCBB] transition-colors"
          >
            Browse Programs
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-4">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-[#6b6b80] uppercase tracking-[1px] mt-0.5">{label}</p>
      {sub && (
        <p className="text-[10px] text-[#4a4a5a] mt-1">{sub}</p>
      )}
    </div>
  );
}

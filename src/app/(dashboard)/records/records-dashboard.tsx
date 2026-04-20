'use client';

import { useState } from 'react';
import { Trophy, TrendingUp, ArrowLeft, ChevronRight, Dumbbell, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface PREntry {
  weight: number;
  reps: number;
  estimated_1rm: number;
  achieved_at: string;
}

interface ExerciseData {
  name: string;
  best: PREntry;
  history: PREntry[];
  totalPRs: number;
}

interface RecordsDashboardProps {
  exercises: ExerciseData[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
}

export function RecordsDashboard({ exercises }: RecordsDashboardProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const selected = exercises.find((e) => e.name === selectedExercise);
  const totalPRs = exercises.reduce((sum, e) => sum + e.totalPRs, 0);

  if (selected) {
    // Detail view
    const chartData = selected.history.map((h) => ({
      date: formatShortDate(h.achieved_at),
      '1RM': Math.round(h.estimated_1rm),
      weight: h.weight,
    }));

    const firstEntry = selected.history[0];
    const lastEntry = selected.history[selected.history.length - 1];
    const totalGain = firstEntry && lastEntry
      ? Math.round(lastEntry.estimated_1rm - firstEntry.estimated_1rm)
      : 0;
    const gainPct = firstEntry && firstEntry.estimated_1rm > 0
      ? Math.round(((lastEntry.estimated_1rm - firstEntry.estimated_1rm) / firstEntry.estimated_1rm) * 100)
      : 0;

    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedExercise(null)}
          className="flex items-center gap-1.5 text-sm text-[#6b6b80] hover:text-[#a0a0b8] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          All Records
        </button>

        {/* Exercise header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#00E5CC]/10 border border-[#00E5CC]/20 flex items-center justify-center">
            <Dumbbell className="h-5 w-5 text-[#00E5CC]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{selected.name}</h1>
            <p className="text-xs text-[#6b6b80] mt-0.5">{selected.totalPRs} record{selected.totalPRs !== 1 ? 's' : ''} logged</p>
          </div>
        </div>

        {/* Best lift card */}
        <Card className="mb-4">
          <p className="text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-2">Current Best</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-white">{selected.best.weight}</span>
            <span className="text-sm text-[#6b6b80]">lb</span>
            <span className="text-sm text-[#6b6b80] mx-1">&times;</span>
            <span className="text-3xl font-bold text-[#ffab00]">{selected.best.reps}</span>
            <span className="text-sm text-[#6b6b80]">reps</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#00E5CC]" />
              <span className="text-sm text-[#a0a0b8]">Est. 1RM: <span className="font-semibold text-white">{Math.round(selected.best.estimated_1rm)} lb</span></span>
            </div>
            <span className="text-xs text-[#6b6b80]">{formatDate(selected.best.achieved_at)}</span>
          </div>
        </Card>

        {/* Progress stats */}
        {selected.history.length > 1 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-[#2a2a3a] bg-[#15151f] p-3 text-center">
              <p className="text-lg font-bold text-white">{Math.round(firstEntry.estimated_1rm)}</p>
              <p className="text-[10px] text-[#6b6b80] uppercase tracking-[1px]">First 1RM</p>
            </div>
            <div className="rounded-xl border border-[#2a2a3a] bg-[#15151f] p-3 text-center">
              <p className={`text-lg font-bold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalGain >= 0 ? '+' : ''}{totalGain} lb
              </p>
              <p className="text-[10px] text-[#6b6b80] uppercase tracking-[1px]">Total Gain</p>
            </div>
            <div className="rounded-xl border border-[#2a2a3a] bg-[#15151f] p-3 text-center">
              <p className={`text-lg font-bold ${gainPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {gainPct >= 0 ? '+' : ''}{gainPct}%
              </p>
              <p className="text-[10px] text-[#6b6b80] uppercase tracking-[1px]">Improvement</p>
            </div>
          </div>
        )}

        {/* 1RM Trend Chart */}
        {selected.history.length > 1 && (
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-[#00E5CC]" />
              <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px]">
                Estimated 1RM Over Time
              </h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#2a2a3a" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b6b80', fontSize: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b6b80', fontSize: 10 }}
                    width={40}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#15151f',
                      border: '1px solid #2a2a3a',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown) => [`${value} lb`, 'Est. 1RM']}
                  />
                  <Line
                    type="monotone"
                    dataKey="1RM"
                    stroke="#00E5CC"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#00E5CC', stroke: '#0a0a0f', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#00E5CC' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Full history list */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-[#00E5CC]" />
            <h3 className="text-[11px] font-semibold text-[#6b6b80] uppercase tracking-[1.5px]">
              PR History
            </h3>
          </div>
          <div className="space-y-2">
            {[...selected.history].reverse().map((h, i) => {
              const isBest = h.estimated_1rm === selected.best.estimated_1rm
                && h.achieved_at === selected.best.achieved_at;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                    isBest ? 'bg-[#00E5CC]/5 border border-[#00E5CC]/20' : 'bg-[#15151f] border border-[#2a2a3a]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isBest && <Trophy className="h-3.5 w-3.5 text-[#ffab00]" />}
                    <div>
                      <span className="text-sm font-semibold text-white">{h.weight} lb &times; {h.reps}</span>
                      <span className="text-xs text-[#6b6b80] ml-2">1RM: {Math.round(h.estimated_1rm)} lb</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#6b6b80]">{formatDate(h.achieved_at)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // List view
  const isEmpty = exercises.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#00E5CC]/10 border border-[#00E5CC]/20 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-[#00E5CC]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#f0f0f5]">Personal Records</h1>
          <p className="text-xs text-[#6b6b80] mt-0.5">
            {isEmpty ? 'No PRs yet' : `${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} \u00b7 ${totalPRs} records`}
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#15151f] border border-[#2a2a3a] flex items-center justify-center mb-4">
            <Trophy className="h-7 w-7 text-[#6b6b80]" />
          </div>
          <p className="text-sm font-semibold text-[#a0a0b8] mb-1">No personal records yet</p>
          <p className="text-xs text-[#6b6b80] text-center max-w-[260px]">
            Complete workouts with logged weights and reps to start tracking PRs.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex) => {
            const recent = daysSince(ex.best.achieved_at) <= 7;
            const improved = ex.history.length > 1;
            const prevBest = improved
              ? ex.history.slice(0, -1).reduce((max, h) => Math.max(max, h.estimated_1rm), 0)
              : 0;
            const improvement = improved && prevBest > 0
              ? Math.round(((ex.best.estimated_1rm - prevBest) / prevBest) * 100)
              : 0;

            return (
              <button
                key={ex.name}
                onClick={() => setSelectedExercise(ex.name)}
                className={`w-full text-left rounded-2xl border p-4 transition-colors cursor-pointer ${
                  recent
                    ? 'border-[#00E5CC]/40 bg-[#00E5CC]/5 hover:bg-[#00E5CC]/10'
                    : 'border-[#2a2a3a] bg-[#15151f] hover:border-[#3a3a4a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-[#f0f0f5] truncate">
                        {ex.name}
                      </p>
                      {recent && (
                        <span className="flex-shrink-0 text-[9px] font-bold text-[#00E5CC] uppercase bg-[#00E5CC]/10 px-1.5 py-0.5 rounded-full">
                          New PR
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 mb-1.5">
                      <span className="text-lg font-bold text-[#f0f0f5]">{ex.best.weight}</span>
                      <span className="text-[11px] text-[#6b6b80]">lb</span>
                      <span className="text-[11px] text-[#6b6b80] mx-0.5">&times;</span>
                      <span className="text-lg font-bold text-[#ffab00]">{ex.best.reps}</span>
                      <span className="text-[11px] text-[#6b6b80]">reps</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#6b6b80]">
                        1RM: {Math.round(ex.best.estimated_1rm)} lb
                      </span>
                      {improvement > 0 && (
                        <span className="text-[10px] font-semibold text-green-400">+{improvement}%</span>
                      )}
                      <span className="text-[10px] text-[#4a4a5a]">
                        {ex.totalPRs} record{ex.totalPRs !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-[#4a4a5a] flex-shrink-0 ml-2" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

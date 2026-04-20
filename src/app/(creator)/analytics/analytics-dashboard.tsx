'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  Clock,
  Trophy,
  TrendingUp,
  Dumbbell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface RetentionPoint {
  week: number;
  pct: number;
}

interface PeakTime {
  label: string;
  pct: number;
}

interface TopExercise {
  name: string;
  count: number;
}

interface ProgramStat {
  id: string;
  title: string;
  status: string;
  durationWeeks: number;
  totalActivations: number;
  activeUsers: number;
  completed: number;
  completionRate: number;
  totalSessions: number;
  uniqueUsers: number;
  avgDuration: number;
}

interface WeeklyTrend {
  week: string;
  sessions: number;
  users: number;
}

interface AnalyticsDashboardProps {
  retentionData: RetentionPoint[];
  peakTimes: PeakTime[];
  maxPeakPct: number;
  topExercises: TopExercise[];
  perProgram: ProgramStat[];
  weeklyTrend: WeeklyTrend[];
  totalActivated: number;
  totalSessions: number;
  hasData: boolean;
}

type TrendMetric = 'sessions' | 'users';

export function AnalyticsDashboard({
  retentionData,
  peakTimes,
  maxPeakPct,
  topExercises,
  perProgram,
  weeklyTrend,
  totalActivated,
  totalSessions,
  hasData,
}: AnalyticsDashboardProps) {
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('sessions');
  const [sortField, setSortField] = useState<'totalActivations' | 'completionRate' | 'totalSessions'>('totalActivations');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedPrograms = [...perProgram].sort((a, b) =>
    sortAsc ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
  );

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortAsc
      ? <ChevronUp className="h-3 w-3 inline ml-0.5" />
      : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  // SVG retention curve
  const svgW = 560;
  const svgH = 220;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const maxPct = Math.max(100, ...retentionData.map((d) => d.pct));
  const minPct = Math.max(0, Math.min(...retentionData.map((d) => d.pct)) - 10);
  const range = maxPct - minPct || 1;

  const retentionPoints = retentionData.map((d, i) => {
    const x = padL + (i / Math.max(1, retentionData.length - 1)) * chartW;
    const y = padT + (1 - (d.pct - minPct) / range) * chartH;
    return { x, y, ...d };
  });

  const polyline = retentionPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = retentionPoints.length > 0 ? [
    `M ${retentionPoints[0].x},${retentionPoints[0].y}`,
    ...retentionPoints.slice(1).map((p) => `L ${p.x},${p.y}`),
    `L ${retentionPoints[retentionPoints.length - 1].x},${padT + chartH}`,
    `L ${retentionPoints[0].x},${padT + chartH}`,
    'Z',
  ].join(' ') : '';

  const finalRetention = retentionData.length > 0 ? retentionData[retentionData.length - 1].pct : 0;
  const gridPcts = [100, 75, 50, 25, 0].filter((p) => p >= minPct && p <= maxPct);

  if (!hasData) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-[#a0a0b8] mt-1">Deep dive into your program performance.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#15151f] border border-[#2a2a3a] flex items-center justify-center mb-4">
            <BarChart3 className="h-7 w-7 text-[#6b6b80]" />
          </div>
          <p className="text-sm font-semibold text-[#a0a0b8] mb-1">No analytics data yet</p>
          <p className="text-xs text-[#6b6b80] text-center max-w-[280px]">
            Publish a program and get users activated to start seeing analytics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-[#a0a0b8] mt-1">
          Deep dive into your program performance.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MiniStat icon={<Users className="h-4 w-4" />} color="#00E5CC" value={totalActivated} label="Total Activations" />
        <MiniStat icon={<Dumbbell className="h-4 w-4" />} color="#00d2ff" value={totalSessions} label="Workout Sessions" />
        <MiniStat icon={<Trophy className="h-4 w-4" />} color="#ffab00" value={`${finalRetention}%`} label="Retention (final)" />
        <MiniStat icon={<Clock className="h-4 w-4" />} color="#ff6b6b" value={perProgram.length} label="Programs" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Retention Curve */}
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6">
          <h2 className="text-lg font-bold text-white mb-1">User retention curve</h2>
          <p className="text-xs text-[#a0a0b8] mb-4">
            {finalRetention}% of users reach the final week
          </p>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5CC" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#00E5CC" stopOpacity="0" />
              </linearGradient>
            </defs>

            {gridPcts.map((pct) => {
              const y = padT + (1 - (pct - minPct) / range) * chartH;
              return (
                <g key={pct}>
                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#2a2a3a" strokeWidth="1" />
                  <text x={padL - 8} y={y + 4} textAnchor="end" fill="#6b6b80" fontSize="10">{pct}%</text>
                </g>
              );
            })}

            {areaPath && <path d={areaPath} fill="url(#retGrad)" />}
            {polyline && (
              <polyline points={polyline} fill="none" stroke="#00E5CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {retentionPoints.map((p) => (
              <circle key={p.week} cx={p.x} cy={p.y} r="3" fill="#0a0a0f" stroke="#00E5CC" strokeWidth="2" />
            ))}
            {retentionPoints.map((p) => (
              <text key={`l-${p.week}`} x={p.x} y={svgH - 4} textAnchor="middle" fill="#6b6b80" fontSize="9">
                W{p.week}
              </text>
            ))}
          </svg>
        </div>

        {/* Peak Training Times */}
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6">
          <h2 className="text-lg font-bold text-white mb-1">Peak training times</h2>
          <p className="text-xs text-[#a0a0b8] mb-6">
            When your users train most
          </p>

          <div className="space-y-5">
            {peakTimes.map((slot) => {
              const isTop = slot.pct === maxPeakPct;
              return (
                <div key={slot.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#CCCCCC]">{slot.label}</span>
                    <span className={`text-sm font-bold ${isTop ? 'text-[#00E5CC]' : 'text-white'}`}>
                      {slot.pct}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[#2a2a3a] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isTop ? 'bg-[#00E5CC]' : 'bg-[#7799DD]'}`}
                      style={{ width: `${Math.max(2, slot.pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Weekly activity</h2>
            <p className="text-xs text-[#a0a0b8] mt-0.5">Last 12 weeks</p>
          </div>
          <div className="flex rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] p-0.5">
            {(['sessions', 'users'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTrendMetric(m)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors capitalize cursor-pointer ${
                  trendMetric === m ? 'bg-[#2a2a3a] text-white' : 'text-[#6b6b80] hover:text-[#a0a0b8]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5CC" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00E5CC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2a3a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#6b6b80', fontSize: 10 }} interval={1} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b6b80', fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{ backgroundColor: '#15151f', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#FFFFFF', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey={trendMetric} stroke="#00E5CC" strokeWidth={2} fill="url(#trendGrad)" dot={false} activeDot={{ r: 4, fill: '#00E5CC' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Most Completed Exercises */}
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6">
          <h2 className="text-lg font-bold text-white mb-6">Top exercises</h2>
          {topExercises.length > 0 ? (
            <div className="space-y-3">
              {topExercises.map((ex, i) => (
                <div key={ex.name} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-[#00E5CC] text-white' : 'bg-[#2a2a3a] text-[#a0a0b8]'
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ex.name}</p>
                    <div className="h-1.5 rounded-full bg-[#2a2a3a] mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#00E5CC]"
                        style={{ width: `${(ex.count / (topExercises[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#00d2ff] flex-shrink-0">{ex.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6b6b80]">No exercise data yet</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6">
          <h2 className="text-lg font-bold text-white mb-6">Overview</h2>
          <div className="space-y-4">
            {[
              { label: 'Published programs', value: perProgram.filter((p) => p.status === 'published').length },
              { label: 'Draft programs', value: perProgram.filter((p) => p.status === 'draft').length },
              { label: 'Total users activated', value: totalActivated },
              { label: 'Total workouts completed', value: totalSessions },
              { label: 'Avg completion rate', value: `${perProgram.length > 0 ? Math.round(perProgram.reduce((s, p) => s + p.completionRate, 0) / perProgram.length) : 0}%` },
              { label: 'Programs fully completed', value: perProgram.reduce((s, p) => s + p.completed, 0) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-[#a0a0b8]">{item.label}</span>
                <span className="text-sm font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Program Breakdown */}
      {perProgram.length > 0 && (
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6">
          <h2 className="text-lg font-bold text-white mb-6">Program breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#6b6b80] uppercase tracking-[1px]">
                  <th className="text-left pb-3 font-medium">Program</th>
                  <th className="text-center pb-3 font-medium cursor-pointer hover:text-[#a0a0b8]" onClick={() => toggleSort('totalActivations')}>
                    Activations <SortIcon field="totalActivations" />
                  </th>
                  <th className="text-center pb-3 font-medium">Active</th>
                  <th className="text-center pb-3 font-medium cursor-pointer hover:text-[#a0a0b8]" onClick={() => toggleSort('completionRate')}>
                    Completion <SortIcon field="completionRate" />
                  </th>
                  <th className="text-center pb-3 font-medium cursor-pointer hover:text-[#a0a0b8]" onClick={() => toggleSort('totalSessions')}>
                    Sessions <SortIcon field="totalSessions" />
                  </th>
                  <th className="text-center pb-3 font-medium">Unique Users</th>
                  <th className="text-center pb-3 font-medium">Avg Duration</th>
                  <th className="text-right pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedPrograms.map((p) => (
                  <tr key={p.id} className="border-t border-[#2a2a3a]">
                    <td className="py-3">
                      <p className="text-sm font-semibold text-white">{p.title}</p>
                      <p className="text-[11px] text-[#6b6b80]">{p.durationWeeks} weeks</p>
                    </td>
                    <td className="text-center text-[#a0a0b8]">{p.totalActivations || '—'}</td>
                    <td className="text-center text-[#a0a0b8]">{p.activeUsers || '—'}</td>
                    <td className="text-center">
                      {p.totalActivations > 0 ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-[#2a2a3a] overflow-hidden">
                            <div className="h-full rounded-full bg-[#00E5CC]" style={{ width: `${p.completionRate}%` }} />
                          </div>
                          <span className="text-xs text-[#a0a0b8]">{p.completionRate}%</span>
                        </div>
                      ) : (
                        <span className="text-[#6b6b80]">—</span>
                      )}
                    </td>
                    <td className="text-center text-[#a0a0b8]">{p.totalSessions || '—'}</td>
                    <td className="text-center text-[#a0a0b8]">{p.uniqueUsers || '—'}</td>
                    <td className="text-center text-[#a0a0b8]">{p.avgDuration > 0 ? `${p.avgDuration}m` : '—'}</td>
                    <td className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] ${
                        p.status === 'published' ? 'bg-[#1A2A0A] text-[#00E5CC]' : 'bg-[#1f1f2e] text-[#6b6b80]'
                      }`}>
                        {p.status === 'published' ? 'Live' : p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ReactNode;
  color: string;
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-[#6b6b80] uppercase tracking-[1px] mt-0.5">{label}</p>
    </div>
  );
}

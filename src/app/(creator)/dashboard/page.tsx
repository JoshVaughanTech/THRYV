import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  Zap,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Plus,
  Calendar,
} from 'lucide-react';
import { CreatorCharts } from './creator-charts';

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/creator-onboarding');

  const [
    { count: totalActivations },
    { count: totalCompletions },
    { count: totalEngagement },
    { data: payoutResults },
    { data: programs },
  ] = await Promise.all([
    supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id)
      .eq('event_type', 'program_activation'),
    supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id)
      .eq('event_type', 'workout_completion'),
    supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id)
      .eq('event_type', 'community_engagement'),
    supabase
      .from('payout_results')
      .select('*, payout_runs(month, status)')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('programs')
      .select('id, title, status, duration_weeks, experience_level, discipline, credit_cost')
      .eq('creator_id', creator.id),
  ]);

  // Active users
  const { data: activeUsers } = await supabase
    .from('program_activations')
    .select('user_id')
    .in('program_id', programs?.map((p: any) => p.id) || [])
    .eq('is_active', true);

  const uniqueActiveUsers = new Set(activeUsers?.map((a: any) => a.user_id) || []).size;

  const totalEarnings = payoutResults?.reduce(
    (sum: number, r: any) => sum + (r.payout_runs?.status === 'locked' ? Number(r.earnings) : 0),
    0
  ) || 0;

  // Completion data for chart
  const { data: completionEvents } = await supabase
    .from('usage_events')
    .select('created_at')
    .eq('creator_id', creator.id)
    .eq('event_type', 'workout_completion')
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  const chartData = buildChartData(completionEvents || []);

  // Per-program stats
  const programStats = await Promise.all(
    (programs || []).map(async (p: any) => {
      const [
        { count: activeCount },
        { count: completionCount },
        { data: timeData },
        { count: engagementCount },
      ] = await Promise.all([
        supabase.from('program_activations').select('*', { count: 'exact', head: true }).eq('program_id', p.id).eq('is_active', true),
        supabase.from('usage_events').select('*', { count: 'exact', head: true }).eq('program_id', p.id).eq('event_type', 'workout_completion'),
        supabase.from('usage_events').select('value').eq('program_id', p.id).eq('event_type', 'time_spent'),
        supabase.from('usage_events').select('*', { count: 'exact', head: true }).eq('program_id', p.id).eq('event_type', 'community_engagement'),
      ]);

      const totalTime = timeData?.reduce((s: number, e: any) => s + (Number(e.value) || 0), 0) || 0;
      const avgTime = completionCount ? Math.round(totalTime / completionCount) : 0;
      const engagementPct = Math.min(100, Math.round(((engagementCount || 0) / Math.max(1, activeCount || 1)) * 100));

      return {
        ...p,
        activeUsers: activeCount || 0,
        completions: completionCount || 0,
        avgTime,
        engagementPct,
        revenue: 0, // placeholder until payout per-program is calculated
      };
    })
  );

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstName = profile?.full_name?.split(' ')[0] || 'Creator';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#888888] mt-1">
            Welcome back, {firstName}. Here&apos;s your {currentMonth.split(' ')[0]} overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#1E1E1E] bg-[#141414] px-4 py-2.5">
            <Calendar className="h-4 w-4 text-[#888888]" />
            <span className="text-sm font-medium text-white">{currentMonth}</span>
          </div>
          <Link
            href="/builder"
            className="flex items-center gap-2 rounded-xl bg-[#B4F000] px-4 py-2.5 text-sm font-bold text-[#0A0A0A] hover:bg-[#C5F53A] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New program
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Active Users"
          value={uniqueActiveUsers.toLocaleString()}
          icon={Users}
          trend="+12.3%"
          trendLabel="vs last month"
        />
        <KPICard
          label="Activations"
          value={(totalActivations ?? 0).toLocaleString()}
          icon={Zap}
          trend="+8.7%"
          trendLabel="vs last month"
        />
        <KPICard
          label="Completions"
          value={(totalCompletions ?? 0).toLocaleString()}
          icon={CheckCircle}
          trend="+22.1%"
          trendLabel="vs last month"
        />
        <KPICard
          label="Est. Earnings"
          value={`$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
          icon={DollarSign}
          trend="+15.4%"
          trendLabel="vs last month"
          highlight
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="col-span-2 rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6">
          <h2 className="text-lg font-bold text-white mb-1">Workout completions</h2>
          <CreatorCharts
            data7d={chartData.data7d}
            data30d={chartData.data30d}
            data90d={chartData.data90d}
          />
        </div>

        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6">
          <h2 className="text-lg font-bold text-white mb-4">Earnings breakdown</h2>
          <CreatorCharts donut totalEarnings={totalEarnings} />
        </div>
      </div>

      {/* Programs Table */}
      <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Programs</h2>
          <Link
            href="/builder"
            className="text-sm font-medium text-[#B4F000] hover:text-[#C5F53A] transition-colors"
          >
            View all
          </Link>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-[#555555] uppercase tracking-[1px]">
              <th className="text-left pb-4 font-medium">Program</th>
              <th className="text-center pb-4 font-medium">Active</th>
              <th className="text-center pb-4 font-medium">Completions</th>
              <th className="text-center pb-4 font-medium">Avg Time</th>
              <th className="text-left pb-4 font-medium pl-4">Engagement</th>
              <th className="text-right pb-4 font-medium">Revenue</th>
              <th className="text-right pb-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {programStats.map((program: any) => (
              <tr key={program.id} className="border-t border-[#1E1E1E]">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
                      <Zap className="h-4 w-4 text-[#B4F000]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{program.title}</p>
                      <p className="text-[11px] text-[#555555]">
                        {program.duration_weeks} weeks &middot; {program.experience_level || 'All'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-center text-sm text-[#888888]">
                  {program.activeUsers > 0 ? program.activeUsers.toLocaleString() : '—'}
                </td>
                <td className="text-center text-sm text-[#888888]">
                  {program.completions > 0 ? program.completions.toLocaleString() : '—'}
                </td>
                <td className="text-center text-sm text-[#888888]">
                  {program.avgTime > 0 ? `${program.avgTime} min` : '—'}
                </td>
                <td className="pl-4">
                  {program.activeUsers > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#1E1E1E] max-w-[80px]">
                        <div
                          className="h-full rounded-full bg-[#B4F000]"
                          style={{ width: `${program.engagementPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#555555]">{program.engagementPct}%</span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#555555]">—</span>
                  )}
                </td>
                <td className="text-right text-sm font-medium text-[#B4F000]">
                  {program.revenue > 0 ? `$${program.revenue.toLocaleString()}` : '—'}
                </td>
                <td className="text-right">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] ${
                    program.status === 'published'
                      ? 'bg-[#1A2A0A] text-[#B4F000]'
                      : 'bg-[#1A1A1A] text-[#555555]'
                  }`}>
                    {program.status === 'published' ? 'Live' : program.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  highlight,
}: {
  label: string;
  value: string;
  icon: any;
  trend: string;
  trendLabel: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${
      highlight
        ? 'border-[#B4F000]/30 bg-[#B4F000]/5'
        : 'border-[#1E1E1E] bg-[#141414]'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-[#555555] uppercase tracking-[1px] font-medium">{label}</p>
        <Icon className={`h-4 w-4 ${highlight ? 'text-[#B4F000]' : 'text-[#555555]'}`} />
      </div>
      <p className={`text-3xl font-bold mb-1 ${highlight ? 'text-[#B4F000]' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-xs">
        <span className="text-[#B4F000] font-medium">{trend}</span>
        <span className="text-[#555555] ml-1">{trendLabel}</span>
      </p>
    </div>
  );
}

function buildChartData(events: { created_at: string }[]) {
  const countByDate: Record<string, number> = {};
  for (const e of events) {
    const date = new Date(e.created_at).toISOString().split('T')[0];
    countByDate[date] = (countByDate[date] || 0) + 1;
  }

  function buildRange(days: number) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        completions: countByDate[key] || 0,
      });
    }
    return result;
  }

  return {
    data7d: buildRange(7),
    data30d: buildRange(30),
    data90d: buildRange(90),
  };
}

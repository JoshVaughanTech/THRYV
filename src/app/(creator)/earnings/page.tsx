import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Lock,
  DollarSign,
  Zap,
  Clock,
  Users,
} from 'lucide-react';

export default async function CreatorEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/creator-onboarding');

  // Fetch programs, current-month usage events, and payout data in parallel
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const [
    { data: programs },
    { data: completionEvents },
    { data: timeEvents },
    { data: engagementEvents },
    { data: payoutResults },
  ] = await Promise.all([
    supabase
      .from('programs')
      .select('id, title, status, discipline')
      .eq('creator_id', creator.id),
    supabase
      .from('usage_events')
      .select('*')
      .eq('creator_id', creator.id)
      .eq('event_type', 'workout_completion')
      .gte('created_at', currentMonthStart)
      .lte('created_at', currentMonthEnd),
    supabase
      .from('usage_events')
      .select('*')
      .eq('creator_id', creator.id)
      .eq('event_type', 'time_spent')
      .gte('created_at', currentMonthStart)
      .lte('created_at', currentMonthEnd),
    supabase
      .from('usage_events')
      .select('*')
      .eq('creator_id', creator.id)
      .eq('event_type', 'community_engagement')
      .gte('created_at', currentMonthStart)
      .lte('created_at', currentMonthEnd),
    supabase
      .from('payout_results')
      .select('*, payout_runs(month, status)')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  // Current month stats
  const completionCount = completionEvents?.length || 0;
  const totalTimeMinutes = timeEvents?.reduce(
    (sum: number, e: any) => sum + (Number(e.value) || 0),
    0
  ) || 0;
  const engagementCount = engagementEvents?.length || 0;

  // Estimate current month earnings (weighted formula)
  const completionValue = completionCount * 15; // $15 per completion
  const timeValue = totalTimeMinutes * 2; // $2 per minute
  const engagementValue = engagementCount * 10; // $10 per engagement
  const currentMonthEarnings = completionValue + timeValue + engagementValue;

  // Per-program revenue for current month
  const programRevenueData = await Promise.all(
    (programs || []).map(async (p: any) => {
      const [
        { data: pCompletions },
        { data: pTime },
        { count: activeCount },
      ] = await Promise.all([
        supabase
          .from('usage_events')
          .select('*')
          .eq('program_id', p.id)
          .eq('event_type', 'workout_completion')
          .gte('created_at', currentMonthStart)
          .lte('created_at', currentMonthEnd),
        supabase
          .from('usage_events')
          .select('value')
          .eq('program_id', p.id)
          .eq('event_type', 'time_spent')
          .gte('created_at', currentMonthStart)
          .lte('created_at', currentMonthEnd),
        supabase
          .from('program_activations')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', p.id)
          .eq('is_active', true),
      ]);

      const pCompletionCount = pCompletions?.length || 0;
      const pTimeMinutes = pTime?.reduce(
        (s: number, e: any) => s + (Number(e.value) || 0),
        0
      ) || 0;
      const revenue = pCompletionCount * 15 + pTimeMinutes * 2;

      return {
        ...p,
        revenue,
        activeUsers: activeCount || 0,
        completions: pCompletionCount,
      };
    })
  );

  // Calculate total revenue for progress bars
  const totalProgramRevenue = programRevenueData.reduce(
    (sum: number, p: any) => sum + p.revenue,
    0
  );

  // Format payout history from payout_results
  const payoutHistory = (payoutResults || []).map((r: any) => {
    const run = r.payout_runs;
    return {
      id: r.id,
      month: run?.month || 'Unknown',
      completions: r.completion_count ?? 0,
      timeMinutes: r.time_minutes ?? 0,
      engagement: r.engagement_count ?? 0,
      total: Number(r.earnings) || 0,
      status: run?.status || 'pending',
    };
  });

  const currentMonthLabel = now.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Earnings</h1>
          <p className="text-[#a0a0b8] mt-1">
            Track your revenue, payouts, and program performance.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1f1f2e] transition-colors">
          <Download className="h-4 w-4 text-[#a0a0b8]" />
          Export CSV
        </button>
      </div>

      {/* Current Month Card */}
      <Card className="border-[#6c5ce7]/30 bg-[#6c5ce7]/5 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <p className="text-[10px] text-[#a0a0b8] uppercase tracking-[1px] font-medium">
              {currentMonthLabel} &mdash; CURRENT PERIOD
            </p>
          </div>
          <Badge variant="accent" className="text-[10px] font-bold uppercase tracking-[0.5px]">
            In Progress
          </Badge>
        </div>

        <p className="text-5xl font-bold text-[#6c5ce7] mb-8">
          ${currentMonthEarnings.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-3 gap-4">
          <BreakdownCard
            label="Workout completions"
            value={completionCount.toLocaleString()}
            weight="50% weight"
            dotColor="bg-[#6c5ce7]"
          />
          <BreakdownCard
            label="Time spent"
            value={`${totalTimeMinutes.toLocaleString()} min`}
            weight="30% weight"
            dotColor="bg-[#00d2ff]"
          />
          <BreakdownCard
            label="Engagement score"
            value={engagementCount.toLocaleString()}
            weight="20% weight"
            dotColor="bg-[#ffab00]"
          />
        </div>
      </Card>

      {/* Revenue by Program */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Revenue by program</h2>
        <div className="grid grid-cols-3 gap-4">
          {programRevenueData.map((program: any) => (
            <Card key={program.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1f1f2e] flex items-center justify-center">
                  <Zap className="h-4 w-4 text-[#6c5ce7]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{program.title}</p>
                  <p className="text-[11px] text-[#6b6b80]">{program.discipline || 'General'}</p>
                </div>
              </div>

              <p className="text-2xl font-bold text-[#6c5ce7] mb-3">
                ${program.revenue.toLocaleString()}
              </p>

              <div className="flex items-center gap-4 text-xs text-[#a0a0b8] mb-3">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {program.activeUsers} active
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {program.completions} completions
                </span>
              </div>

              {/* Progress bar showing share of total */}
              <div className="h-1.5 rounded-full bg-[#2a2a3a]">
                <div
                  className="h-full rounded-full bg-[#6c5ce7] transition-all"
                  style={{
                    width: `${totalProgramRevenue > 0 ? Math.round((program.revenue / totalProgramRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-[#6b6b80] mt-1">
                {totalProgramRevenue > 0
                  ? `${Math.round((program.revenue / totalProgramRevenue) * 100)}% of total`
                  : '0% of total'}
              </p>
            </Card>
          ))}

          {(!programRevenueData || programRevenueData.length === 0) && (
            <Card className="col-span-3 flex items-center justify-center py-12">
              <p className="text-[#6b6b80] text-sm">No programs yet.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Payout History Table */}
      <Card>
        <h2 className="text-lg font-bold text-white mb-6">Payout history</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-[#6b6b80] uppercase tracking-[1px]">
                <th className="text-left pb-4 font-medium">Month</th>
                <th className="text-center pb-4 font-medium">Completions</th>
                <th className="text-center pb-4 font-medium">Time (min)</th>
                <th className="text-center pb-4 font-medium">Engagement</th>
                <th className="text-right pb-4 font-medium">Total</th>
                <th className="text-right pb-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((row: any) => (
                <tr key={row.id} className="border-t border-[#2a2a3a]">
                  <td className="py-4 text-sm font-medium text-white">
                    {formatMonth(row.month)}
                  </td>
                  <td className="py-4 text-center text-sm text-[#a0a0b8]">
                    {row.completions.toLocaleString()}
                  </td>
                  <td className="py-4 text-center text-sm text-[#a0a0b8]">
                    {row.timeMinutes.toLocaleString()}
                  </td>
                  <td className="py-4 text-center text-sm text-[#a0a0b8]">
                    {row.engagement.toLocaleString()}
                  </td>
                  <td className="py-4 text-right text-sm font-medium text-[#6c5ce7]">
                    ${row.total.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-4 text-right">
                    {row.status === 'locked' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#1A2A0A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[#6c5ce7]">
                        <Lock className="h-3 w-3" />
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#1f1f2e] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[#6b6b80]">
                        {row.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {payoutHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#6b6b80]">
                    No payout history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BreakdownCard({
  label,
  value,
  weight,
  dotColor,
}: {
  label: string;
  value: string;
  weight: string;
  dotColor: string;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a3a] bg-[#15151f] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        <p className="text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-medium">
          {weight}
        </p>
      </div>
      <p className="text-xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-[#a0a0b8]">{label}</p>
    </div>
  );
}

function formatMonth(month: string): string {
  if (!month || month === 'Unknown') return month;
  try {
    // Expected format: "2026-03" or similar
    const [year, m] = month.split('-');
    const date = new Date(Number(year), Number(m) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return month;
  }
}

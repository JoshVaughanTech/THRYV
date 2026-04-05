import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Zap,
  Dumbbell,
  MessageCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { CreatorCharts } from './creator-charts';

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/creator-onboarding');

  // Get metrics
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
      .select('id, title, status')
      .eq('creator_id', creator.id),
  ]);

  // Get unique active users across all programs
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

  // Build completion data for charts (last 90 days)
  const { data: completionEvents } = await supabase
    .from('usage_events')
    .select('created_at')
    .eq('creator_id', creator.id)
    .eq('event_type', 'workout_completion')
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  const chartData = buildChartData(completionEvents || []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Creator Dashboard</h1>
        <p className="text-text-secondary mt-1">Track your programs&apos; performance</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-accent-primary" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Active Users</p>
            <p className="text-2xl font-bold text-text-primary">{uniqueActiveUsers}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-accent-secondary" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Activations</p>
            <p className="text-2xl font-bold text-text-primary">{totalActivations ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Completions</p>
            <p className="text-2xl font-bold text-text-primary">{totalCompletions ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg momentum-gradient flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5 text-[#0A0A0A]" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Est. Earnings</p>
            <p className="text-2xl font-bold text-text-primary">
              ${totalEarnings.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-text-primary mb-4">Workout Completions</h2>
          <CreatorCharts
            data7d={chartData.data7d}
            data30d={chartData.data30d}
            data90d={chartData.data90d}
          />
        </Card>

        <Card>
          <h2 className="font-semibold text-text-primary mb-4">Earnings Breakdown</h2>
          <p className="text-xs text-text-muted mb-4">Payout weighting formula</p>
          <CreatorCharts donut />
        </Card>
      </div>

      {/* Programs Table */}
      {programs && programs.length > 0 && (
        <Card>
          <h2 className="font-semibold text-text-primary mb-4">Your Programs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border-secondary">
                  <th className="pb-2 font-medium">Program</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p: any) => (
                  <tr key={p.id} className="border-b border-border-secondary/50">
                    <td className="py-3 text-text-primary font-medium">{p.title}</td>
                    <td className="py-3 text-right">
                      <Badge variant={p.status === 'published' ? 'success' : p.status === 'draft' ? 'warning' : 'default'}>
                        {p.status === 'published' ? 'LIVE' : p.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Earnings History */}
      {payoutResults && payoutResults.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-semibold text-text-primary mb-4">Earnings History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border-secondary">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium">Completions</th>
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Engagement</th>
                  <th className="pb-2 font-medium">Share</th>
                  <th className="pb-2 font-medium text-right">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {payoutResults.map((result: any) => (
                  <tr key={result.id} className="border-b border-border-secondary/50">
                    <td className="py-3 text-text-primary">{result.payout_runs?.month}</td>
                    <td className="py-3 text-text-secondary">{Number(result.workout_completions_score).toFixed(0)}</td>
                    <td className="py-3 text-text-secondary">{Number(result.time_spent_score).toFixed(0)}</td>
                    <td className="py-3 text-text-secondary">{Number(result.engagement_score).toFixed(0)}</td>
                    <td className="py-3 text-text-secondary">{Number(result.share_pct).toFixed(1)}%</td>
                    <td className="py-3 text-right font-medium text-success">
                      ${Number(result.earnings).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
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

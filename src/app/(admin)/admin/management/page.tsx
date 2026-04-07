'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Coins, DollarSign, Download, Play, RefreshCw } from 'lucide-react';

export default function AdminManagementPage() {
  const supabase = createClient();

  // Credit Adjustment
  const [creditUserId, setCreditUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditMessage, setCreditMessage] = useState('');

  // Monthly Credit Refresh
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  async function handleMonthlyRefresh() {
    setRefreshLoading(true);
    setRefreshMessage('');

    // Get all active subscribers
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('user_id')
      .in('status', ['active', 'trial']);

    if (!activeSubs || activeSubs.length === 0) {
      setRefreshMessage('No active subscribers found.');
      setRefreshLoading(false);
      return;
    }

    const credits = activeSubs.map((s: any) => ({
      user_id: s.user_id,
      amount: 5,
      event_type: 'monthly_grant',
      description: `Monthly credit grant — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    }));

    const { error } = await supabase.from('credit_ledger').insert(credits);

    if (error) {
      setRefreshMessage(`Error: ${error.message}`);
    } else {
      setRefreshMessage(`Granted 5 credits to ${activeSubs.length} subscriber${activeSubs.length !== 1 ? 's' : ''}`);
    }
    setRefreshLoading(false);
  }

  // Payout
  const [payoutMonth, setPayoutMonth] = useState('');
  const [totalRevenue, setTotalRevenue] = useState('');
  const [platformMargin, setPlatformMargin] = useState('30');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');
  const [payoutResults, setPayoutResults] = useState<any[]>([]);

  async function handleCreditAdjustment() {
    setCreditLoading(true);
    setCreditMessage('');

    const { error } = await supabase.from('credit_ledger').insert({
      user_id: creditUserId,
      amount: Number(creditAmount),
      event_type: 'admin_adjustment',
      description: creditDescription || 'Admin adjustment',
    });

    if (error) {
      setCreditMessage(`Error: ${error.message}`);
    } else {
      setCreditMessage(`Successfully adjusted ${creditAmount} credits`);
      setCreditUserId('');
      setCreditAmount('');
      setCreditDescription('');
    }
    setCreditLoading(false);
  }

  async function handlePayoutRun() {
    setPayoutLoading(true);
    setPayoutMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const revenue = Number(totalRevenue);
    const margin = Number(platformMargin) / 100;
    const creatorPool = revenue * (1 - margin);

    // Check if payout already exists for this month
    const { data: existing } = await supabase
      .from('payout_runs')
      .select('*')
      .eq('month', payoutMonth)
      .single();

    if (existing) {
      setPayoutMessage('A payout run already exists for this month');
      setPayoutLoading(false);
      return;
    }

    // Create payout run
    const { data: run, error: runError } = await supabase
      .from('payout_runs')
      .insert({
        month: payoutMonth,
        total_revenue: revenue,
        platform_margin_pct: Number(platformMargin),
        creator_pool: creatorPool,
        status: 'pending',
        triggered_by: user.id,
      })
      .select()
      .single();

    if (runError || !run) {
      setPayoutMessage(`Error creating payout run: ${runError?.message}`);
      setPayoutLoading(false);
      return;
    }

    // Get all creators
    const { data: creators } = await supabase.from('creators').select('id');
    if (!creators || creators.length === 0) {
      setPayoutMessage('No creators found');
      setPayoutLoading(false);
      return;
    }

    // Calculate per-creator scores
    const monthStart = `${payoutMonth}-01`;
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().split('T')[0];

    const results = [];

    for (const creator of creators) {
      // Workout completions
      const { count: completions } = await supabase
        .from('usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creator.id)
        .eq('event_type', 'workout_completion')
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd);

      // Time spent
      const { data: timeData } = await supabase
        .from('usage_events')
        .select('value')
        .eq('creator_id', creator.id)
        .eq('event_type', 'time_spent')
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd);

      const totalTime = timeData?.reduce((sum: number, e: any) => sum + (Number(e.value) || 0), 0) || 0;

      // Engagement
      const { count: engagement } = await supabase
        .from('usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creator.id)
        .eq('event_type', 'community_engagement')
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd);

      results.push({
        creator_id: creator.id,
        completions: completions || 0,
        time: totalTime,
        engagement: engagement || 0,
      });
    }

    // Calculate weighted scores
    const totalCompletions = results.reduce((s, r) => s + r.completions, 0) || 1;
    const totalTimeAll = results.reduce((s, r) => s + r.time, 0) || 1;
    const totalEngagement = results.reduce((s, r) => s + r.engagement, 0) || 1;

    const payoutEntries = results.map((r) => {
      const completionScore = r.completions / totalCompletions;
      const timeScore = r.time / totalTimeAll;
      const engagementScore = r.engagement / totalEngagement;
      const weighted = completionScore * 0.5 + timeScore * 0.3 + engagementScore * 0.2;

      return {
        payout_run_id: run.id,
        creator_id: r.creator_id,
        workout_completions_score: r.completions,
        time_spent_score: r.time,
        engagement_score: r.engagement,
        weighted_score: weighted,
        share_pct: weighted * 100,
        earnings: weighted * creatorPool,
      };
    });

    await supabase.from('payout_results').insert(payoutEntries);

    setPayoutResults(payoutEntries);
    setPayoutMessage(`Payout calculated. Creator pool: $${creatorPool.toFixed(2)}`);
    setPayoutLoading(false);
  }

  async function lockPayout() {
    if (!payoutMonth) return;
    await supabase
      .from('payout_runs')
      .update({ status: 'locked' })
      .eq('month', payoutMonth);
    setPayoutMessage('Payout locked for ' + payoutMonth);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Admin Management</h1>
        <p className="text-text-secondary mt-1">Credit adjustments and payout operations</p>
      </div>

      {/* Monthly Credit Refresh */}
      <Card className="mb-6">
        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-accent-primary" />
          Monthly Credit Refresh
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Grant 5 credits to all active and trial subscribers. Run once per billing cycle.
        </p>
        {refreshMessage && (
          <p className={`text-sm mb-4 ${refreshMessage.startsWith('Error') ? 'text-error' : 'text-success'}`}>
            {refreshMessage}
          </p>
        )}
        <Button onClick={handleMonthlyRefresh} loading={refreshLoading} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Grant Monthly Credits
        </Button>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Credit Adjustment */}
        <Card>
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Coins className="h-5 w-5 text-accent-secondary" />
            Credit Adjustment
          </h2>
          <div className="space-y-4">
            <Input
              label="User ID"
              value={creditUserId}
              onChange={(e) => setCreditUserId(e.target.value)}
              placeholder="UUID of the user"
            />
            <Input
              label="Amount (positive to add, negative to deduct)"
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="e.g. 5 or -2"
            />
            <Input
              label="Description"
              value={creditDescription}
              onChange={(e) => setCreditDescription(e.target.value)}
              placeholder="Reason for adjustment"
            />
            {creditMessage && (
              <p className={`text-sm ${creditMessage.startsWith('Error') ? 'text-error' : 'text-success'}`}>
                {creditMessage}
              </p>
            )}
            <Button onClick={handleCreditAdjustment} loading={creditLoading} className="w-full">
              Apply Adjustment
            </Button>
          </div>
        </Card>

        {/* Payout Run */}
        <Card>
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            Monthly Payout Run
          </h2>
          <div className="space-y-4">
            <Input
              label="Month (YYYY-MM)"
              value={payoutMonth}
              onChange={(e) => setPayoutMonth(e.target.value)}
              placeholder="2026-04"
            />
            <Input
              label="Total Subscription Revenue ($)"
              type="number"
              value={totalRevenue}
              onChange={(e) => setTotalRevenue(e.target.value)}
              placeholder="e.g. 10000"
            />
            <Input
              label="Platform Margin (%)"
              type="number"
              value={platformMargin}
              onChange={(e) => setPlatformMargin(e.target.value)}
            />
            {payoutMessage && (
              <p className={`text-sm ${payoutMessage.startsWith('Error') ? 'text-error' : 'text-success'}`}>
                {payoutMessage}
              </p>
            )}
            <div className="flex gap-3">
              <Button onClick={handlePayoutRun} loading={payoutLoading} className="flex-1 gap-1.5">
                <Play className="h-4 w-4" />
                Run Payout
              </Button>
              <Button variant="secondary" onClick={lockPayout} className="gap-1.5">
                Lock
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Payout Results */}
      {payoutResults.length > 0 && (
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary">Payout Results</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportPayoutCSV(payoutResults, payoutMonth)}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border-secondary">
                  <th className="pb-2 font-medium">Creator ID</th>
                  <th className="pb-2 font-medium">Completions</th>
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Engagement</th>
                  <th className="pb-2 font-medium">Share %</th>
                  <th className="pb-2 font-medium text-right">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {payoutResults.map((result, i) => (
                  <tr key={i} className="border-b border-border-secondary/50">
                    <td className="py-3 text-text-secondary font-mono text-xs">
                      {result.creator_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 text-text-secondary">{result.workout_completions_score}</td>
                    <td className="py-3 text-text-secondary">{result.time_spent_score}</td>
                    <td className="py-3 text-text-secondary">{result.engagement_score}</td>
                    <td className="py-3 text-text-secondary">{result.share_pct.toFixed(1)}%</td>
                    <td className="py-3 text-right font-medium text-success">
                      ${result.earnings.toFixed(2)}
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

function exportPayoutCSV(results: any[], month: string) {
  const headers = ['Creator ID', 'Completions', 'Time Spent', 'Engagement', 'Share %', 'Earnings'];
  const rows = results.map((r) => [
    r.creator_id,
    r.workout_completions_score,
    r.time_spent_score,
    r.engagement_score,
    r.share_pct.toFixed(2),
    r.earnings.toFixed(2),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payout-${month || 'results'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

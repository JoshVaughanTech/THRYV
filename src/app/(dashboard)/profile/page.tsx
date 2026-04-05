import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  TrendingUp,
  Flame,
  Coins,
  Calendar,
  Award,
  Dumbbell,
  Clock,
} from 'lucide-react';
import { ProfileCharts } from './profile-charts';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: subscription },
    { data: streak },
    { data: creditBalance },
    { data: momentum },
    { data: recentMomentum },
    { data: creditHistory },
    { count: sessionCount },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('streaks').select('*').eq('user_id', user.id).single(),
    supabase.rpc('get_credit_balance', { p_user_id: user.id }),
    supabase.rpc('get_momentum_total', { p_user_id: user.id }),
    supabase
      .from('momentum_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('credit_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('workout_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(30),
  ]);

  const momentumLevel = Math.floor((momentum || 0) / 100) + 1;
  const nextLevelProgress = ((momentum || 0) % 100);

  // Build daily momentum data for chart (last 7 days)
  const dailyMomentum = buildDailyMomentum(recentMomentum || []);

  // Calculate weekly workout rate for progress rings
  const totalWorkouts = sessionCount ?? 0;
  const weeksActive = Math.max(1, Math.ceil(
    (Date.now() - new Date(profile?.created_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)
  ));
  const avgPerWeek = Math.round((totalWorkouts / weeksActive) * 10) / 10;
  // Assume target of 4 workouts/week for percentage
  const workoutPct = Math.min(100, Math.round((avgPerWeek / 4) * 100));

  // Consistency: days with workouts in last 7 days
  const last7Days = new Set<string>();
  (recentSessions || []).forEach((s: any) => {
    if (!s.completed_at) return;
    const d = new Date(s.completed_at);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
    if (diff <= 7) last7Days.add(d.toISOString().split('T')[0]);
  });
  const consistencyPct = Math.round((last7Days.size / 7) * 100);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="mb-6 flex items-start gap-6">
        <div className="w-16 h-16 rounded-full momentum-gradient flex items-center justify-center text-2xl font-bold text-[#0A0A0A] flex-shrink-0">
          {profile?.full_name?.charAt(0) || '?'}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text-primary">{profile?.full_name || 'Athlete'}</h2>
          <p className="text-sm text-text-muted">{profile?.email}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {profile?.goals?.map((goal: string) => (
              <Badge key={goal} variant="accent">{goal}</Badge>
            ))}
            {profile?.experience_level && <Badge>{profile.experience_level}</Badge>}
          </div>
        </div>
      </Card>

      {/* Dual-Ring Progress + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="md:col-span-1 flex items-center justify-center py-6">
          <ProfileCharts
            workoutPct={workoutPct}
            consistencyPct={consistencyPct}
            avgPerWeek={avgPerWeek}
            consistencyDays={last7Days.size}
            dailyMomentum={dailyMomentum}
          />
        </Card>

        <div className="md:col-span-2 grid grid-cols-3 gap-4">
          <Card className="text-center py-5">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-accent-primary" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{momentum || 0}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-[1px]">Momentum</p>
            <p className="text-xs text-accent-primary mt-1">Level {momentumLevel}</p>
          </Card>
          <Card className="text-center py-5">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
              <Flame className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{streak?.current_streak || 0}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-[1px]">Day Streak</p>
            <p className="text-xs text-text-muted mt-1">Best: {streak?.longest_streak || 0}</p>
          </Card>
          <Card className="text-center py-5">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{avgPerWeek}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-[1px]">Hrs/Week</p>
            <p className="text-xs text-text-muted mt-1">{totalWorkouts} total</p>
          </Card>
        </div>
      </div>

      {/* Momentum Level Progress */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-text-primary">Momentum Progress</h3>
          <span className="text-sm text-accent-primary">Level {momentumLevel}</span>
        </div>
        <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden mb-2">
          <div
            className="h-full rounded-full momentum-gradient transition-all"
            style={{ width: `${nextLevelProgress}%` }}
          />
        </div>
        <p className="text-xs text-text-muted">
          {100 - nextLevelProgress} points to Level {momentumLevel + 1}
        </p>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription Info */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent-primary" />
            Subscription
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-text-muted">Status</span>
              <Badge variant={subscription?.status === 'active' ? 'success' : subscription?.status === 'trial' ? 'warning' : 'error'}>
                {subscription?.status || 'None'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted">Credits</span>
              <span className="text-sm font-medium text-text-primary">{creditBalance ?? 0}</span>
            </div>
            {subscription?.trial_end && subscription.status === 'trial' && (
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Trial Ends</span>
                <span className="text-sm text-text-primary">
                  {new Date(subscription.trial_end).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Momentum */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent-primary" />
            Recent Momentum
          </h3>
          {recentMomentum && recentMomentum.length > 0 ? (
            <div className="space-y-2">
              {recentMomentum.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary capitalize">
                    {event.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium text-success">+{event.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No momentum events yet</p>
          )}
        </Card>
      </div>

      {/* Credit Ledger */}
      <Card className="mt-6">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Coins className="h-4 w-4 text-accent-secondary" />
          Credit History
        </h3>
        {creditHistory && creditHistory.length > 0 ? (
          <div className="space-y-2">
            {creditHistory.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-text-secondary capitalize">
                    {entry.event_type.replace(/_/g, ' ')}
                  </span>
                  {entry.description && (
                    <span className="text-text-muted ml-2">— {entry.description}</span>
                  )}
                </div>
                <span
                  className={`font-medium ${entry.amount >= 0 ? 'text-success' : 'text-error'}`}
                >
                  {entry.amount >= 0 ? '+' : ''}{entry.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No credit history yet</p>
        )}
      </Card>
    </div>
  );
}

function buildDailyMomentum(events: any[]): { day: string; points: number }[] {
  const days: Record<string, number> = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days[key] = 0;
  }

  // Sum points per day
  for (const event of events) {
    const key = new Date(event.created_at).toISOString().split('T')[0];
    if (key in days) {
      days[key] += event.points || 0;
    }
  }

  return Object.entries(days).map(([dateStr, points]) => ({
    day: dayNames[new Date(dateStr).getDay()],
    points,
  }));
}

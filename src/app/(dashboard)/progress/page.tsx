import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProgressCharts } from './progress-charts';

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: streak },
    { data: momentum },
    { data: recentMomentum },
    { count: sessionCount },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('streaks').select('*').eq('user_id', user.id).single(),
    supabase.rpc('get_momentum_total', { p_user_id: user.id }),
    supabase
      .from('momentum_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('workout_sessions')
      .select('completed_at, duration_minutes')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(30),
  ]);

  // Momentum level calculations
  const momentumTotal = momentum || 0;
  const momentumLevel = Math.floor(momentumTotal / 500) + 1;
  const levelFloor = (momentumLevel - 1) * 500;
  const nextLevelTotal = momentumLevel * 500;
  const nextLevelProgress = momentumTotal - levelFloor;
  const pointsToNextLevel = nextLevelTotal - momentumTotal;

  // Build daily momentum data for chart (last 7 days)
  const dailyMomentum = buildDailyMomentum(recentMomentum || []);

  // Calculate weekly workout rate for progress rings
  const totalWorkouts = sessionCount ?? 0;
  const weeksActive = Math.max(
    1,
    Math.ceil(
      (Date.now() - new Date(profile?.created_at || Date.now()).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    )
  );
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

  // Hours per week: sum duration_minutes from recent sessions in last 7 days
  let weeklyMinutes = 0;
  (recentSessions || []).forEach((s: any) => {
    if (!s.completed_at) return;
    const d = new Date(s.completed_at);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
    if (diff <= 7) weeklyMinutes += s.duration_minutes || 0;
  });
  const hrsPerWeek = Math.round((weeklyMinutes / 60) * 10) / 10;

  return (
    <div className="max-w-lg mx-auto">
      <ProgressCharts
        workoutPct={workoutPct}
        consistencyPct={consistencyPct}
        avgPerWeek={avgPerWeek}
        consistencyDays={last7Days.size}
        dailyMomentum={dailyMomentum}
        momentum={momentumTotal}
        momentumLevel={momentumLevel}
        currentStreak={streak?.current_streak || 0}
        longestStreak={streak?.longest_streak || 0}
        hrsPerWeek={hrsPerWeek}
        totalWorkouts={totalWorkouts}
        nextLevelProgress={momentumTotal}
        nextLevelTotal={nextLevelTotal}
        pointsToNextLevel={pointsToNextLevel}
      />
    </div>
  );
}

function buildDailyMomentum(events: any[]): { day: string; points: number }[] {
  const days: Record<string, number> = {};
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
    day: dayLabels[new Date(dateStr).getDay()],
    points,
  }));
}

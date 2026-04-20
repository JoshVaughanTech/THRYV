import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProgressDashboard } from './progress-dashboard';

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [
    { data: profile },
    { data: streak },
    { data: momentumTotal },
    { data: momentumEvents },
    { data: sessions },
    { data: personalRecords },
    { data: activations },
  ] = await Promise.all([
    supabase.from('profiles').select('created_at').eq('id', user.id).single(),
    supabase.from('streaks').select('*').eq('user_id', user.id).single(),
    supabase.rpc('get_momentum_total', { p_user_id: user.id }),
    supabase
      .from('momentum_events')
      .select('points, event_type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('workout_sessions')
      .select('id, completed_at, duration_seconds, workout_id, program_id')
      .eq('user_id', user.id)
      .gte('completed_at', ninetyDaysAgo.toISOString())
      .order('completed_at', { ascending: true }),
    supabase
      .from('personal_records')
      .select('exercise_name, weight, reps, estimated_1rm, achieved_at')
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: true }),
    supabase
      .from('program_activations')
      .select('id, is_active, completed_at')
      .eq('user_id', user.id),
  ]);

  // Fetch set_logs for volume calculation
  const sessionIds = (sessions || []).map((s: any) => s.id);
  let setLogs: any[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from('set_logs')
      .select('session_id, weight, reps, completed')
      .in('session_id', sessionIds);
    setLogs = data || [];
  }

  // Build volume per session
  const volumeBySession: Record<string, number> = {};
  for (const log of setLogs) {
    if (!log.completed) continue;
    const vol = (Number(log.weight) || 0) * (Number(log.reps) || 0);
    volumeBySession[log.session_id] = (volumeBySession[log.session_id] || 0) + vol;
  }

  // Build daily session data (date -> { count, volume, duration })
  const dailyData: Record<string, { count: number; volume: number; duration: number }> = {};
  for (const s of sessions || []) {
    const dateKey = new Date(s.completed_at).toISOString().split('T')[0];
    if (!dailyData[dateKey]) dailyData[dateKey] = { count: 0, volume: 0, duration: 0 };
    dailyData[dateKey].count += 1;
    dailyData[dateKey].volume += volumeBySession[s.id] || 0;
    dailyData[dateKey].duration += s.duration_seconds || 0;
  }

  // Build weekly aggregated data for charts (last 12 weeks)
  const weeklyVolume: { week: string; volume: number; workouts: number; duration: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let volume = 0;
    let workouts = 0;
    let duration = 0;

    for (const [dateStr, data] of Object.entries(dailyData)) {
      const d = new Date(dateStr);
      if (d >= weekStart && d < weekEnd) {
        volume += data.volume;
        workouts += data.count;
        duration += data.duration;
      }
    }

    weeklyVolume.push({ week: label, volume, workouts, duration: Math.round(duration / 60) });
  }

  // Heatmap data: last 84 days (12 weeks)
  const heatmapData: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    heatmapData.push({ date: key, count: dailyData[key]?.count || 0 });
  }

  // PR data: group by exercise, track history
  const prByExercise: Record<string, { name: string; best1rm: number; bestWeight: number; bestReps: number; achievedAt: string; history: { date: string; estimated_1rm: number }[] }> = {};
  for (const pr of personalRecords || []) {
    const e1rm = Number(pr.estimated_1rm) || 0;
    if (!prByExercise[pr.exercise_name]) {
      prByExercise[pr.exercise_name] = {
        name: pr.exercise_name,
        best1rm: 0,
        bestWeight: 0,
        bestReps: 0,
        achievedAt: pr.achieved_at,
        history: [],
      };
    }
    const entry = prByExercise[pr.exercise_name];
    entry.history.push({ date: pr.achieved_at, estimated_1rm: e1rm });
    if (e1rm > entry.best1rm) {
      entry.best1rm = e1rm;
      entry.bestWeight = Number(pr.weight);
      entry.bestReps = pr.reps;
      entry.achievedAt = pr.achieved_at;
    }
  }

  const topPRs = Object.values(prByExercise)
    .sort((a, b) => b.best1rm - a.best1rm)
    .slice(0, 6);

  // Totals
  const totalSessions = sessions?.length || 0;
  const totalVolume = Object.values(volumeBySession).reduce((sum, v) => sum + v, 0);
  const totalDuration = (sessions || []).reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
  const totalPRs = personalRecords?.length || 0;
  const programsCompleted = (activations || []).filter((a: any) => a.completed_at).length;
  const programsActive = (activations || []).filter((a: any) => a.is_active && !a.completed_at).length;

  // Momentum level
  const momentum = momentumTotal || 0;
  const momentumLevel = Math.floor(momentum / 500) + 1;
  const nextLevelTotal = momentumLevel * 500;
  const pointsToNext = nextLevelTotal - momentum;

  // Build daily momentum for bar chart
  const dailyMomentum: { day: string; points: number }[] = [];
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    let pts = 0;
    for (const ev of momentumEvents || []) {
      if (new Date(ev.created_at).toISOString().split('T')[0] === key) {
        pts += ev.points || 0;
      }
    }
    dailyMomentum.push({ day: dayLabels[d.getDay()], points: pts });
  }

  // Consistency: unique workout days in last 7 and 30 days
  const last7 = new Set<string>();
  const last30 = new Set<string>();
  for (const s of sessions || []) {
    const d = new Date(s.completed_at);
    const diff = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    if (diff <= 7) last7.add(key);
    if (diff <= 30) last30.add(key);
  }

  return (
    <ProgressDashboard
      totalSessions={totalSessions}
      totalVolume={totalVolume}
      totalDuration={totalDuration}
      totalPRs={totalPRs}
      programsActive={programsActive}
      programsCompleted={programsCompleted}
      currentStreak={streak?.current_streak || 0}
      longestStreak={streak?.longest_streak || 0}
      momentum={momentum}
      momentumLevel={momentumLevel}
      nextLevelTotal={nextLevelTotal}
      pointsToNext={pointsToNext}
      dailyMomentum={dailyMomentum}
      weeklyVolume={weeklyVolume}
      heatmapData={heatmapData}
      topPRs={topPRs}
      consistencyLast7={last7.size}
      consistencyLast30={last30.size}
      memberSince={profile?.created_at || now.toISOString()}
    />
  );
}

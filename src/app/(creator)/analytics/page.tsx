import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsDashboard } from './analytics-dashboard';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/creator-signup');

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Fetch creator's programs
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, status, duration_weeks, credit_cost')
    .eq('creator_id', creator.id);

  const programIds = programs?.map((p: any) => p.id) || [];

  // Fetch activations for retention calculation
  const { data: activations } = await supabase
    .from('program_activations')
    .select('user_id, program_id, activated_at, completed_at, current_week, is_active')
    .in('program_id', programIds.length > 0 ? programIds : ['none']);

  // Fetch workout sessions for this creator's programs
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, completed_at, duration_seconds, workout_id, program_id, user_id')
    .in('program_id', programIds.length > 0 ? programIds : ['none'])
    .gte('completed_at', ninetyDaysAgo.toISOString())
    .order('completed_at', { ascending: true });

  // Fetch exercises from creator's workouts for top exercises
  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, title')
    .in('program_id', programIds.length > 0 ? programIds : ['none']);

  const workoutIds = workouts?.map((w: any) => w.id) || [];

  // Fetch set_logs to determine most-completed exercises
  const sessionIds = (sessions || []).map((s: any) => s.id);
  let setLogs: any[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from('set_logs')
      .select('session_id, exercise_id, completed')
      .in('session_id', sessionIds);
    setLogs = data || [];
  }

  // Fetch exercises for names
  let exercises: any[] = [];
  if (workoutIds.length > 0) {
    const { data } = await supabase
      .from('exercises')
      .select('id, name, workout_id')
      .in('workout_id', workoutIds);
    exercises = data || [];
  }

  // Build top exercises by set completions
  const exerciseCompletions: Record<string, { name: string; count: number }> = {};
  const exerciseMap = new Map(exercises.map((e: any) => [e.id, e.name]));
  for (const log of setLogs) {
    if (!log.completed) continue;
    const name = exerciseMap.get(log.exercise_id);
    if (!name) continue;
    if (!exerciseCompletions[name]) exerciseCompletions[name] = { name, count: 0 };
    exerciseCompletions[name].count += 1;
  }
  const topExercises = Object.values(exerciseCompletions)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Build retention curve per week (what % of users who activated are still active by week N)
  const maxWeeks = Math.max(12, ...(programs || []).map((p: any) => p.duration_weeks || 12));
  const retentionData: { week: number; pct: number }[] = [];
  const totalActivated = activations?.length || 0;

  for (let w = 1; w <= Math.min(maxWeeks, 12); w++) {
    if (totalActivated === 0) {
      retentionData.push({ week: w, pct: 0 });
    } else {
      // Users who reached at least week W (current_week >= w OR completed)
      const reachedWeek = (activations || []).filter((a: any) =>
        a.current_week >= w || a.completed_at
      ).length;
      retentionData.push({ week: w, pct: Math.round((reachedWeek / totalActivated) * 100) });
    }
  }

  // Peak training times from sessions
  const hourCounts: Record<number, number> = {};
  for (const s of sessions || []) {
    const hour = new Date(s.completed_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  const timeSlots = [
    { label: '5–8 AM', hours: [5, 6, 7] },
    { label: '8–11 AM', hours: [8, 9, 10] },
    { label: '11–1 PM', hours: [11, 12] },
    { label: '1–4 PM', hours: [13, 14, 15] },
    { label: '4–7 PM', hours: [16, 17, 18] },
    { label: '7–10 PM', hours: [19, 20, 21] },
  ];

  const totalSessionCount = sessions?.length || 1;
  const peakTimes = timeSlots.map((slot) => {
    const count = slot.hours.reduce((sum, h) => sum + (hourCounts[h] || 0), 0);
    return {
      label: slot.label,
      pct: Math.round((count / totalSessionCount) * 100),
    };
  });
  const maxPeakPct = Math.max(1, ...peakTimes.map((p) => p.pct));

  // Per-program stats
  const perProgram = (programs || []).map((p: any) => {
    const progActivations = (activations || []).filter((a: any) => a.program_id === p.id);
    const progSessions = (sessions || []).filter((s: any) => s.program_id === p.id);
    const completed = progActivations.filter((a: any) => a.completed_at).length;
    const active = progActivations.filter((a: any) => a.is_active && !a.completed_at).length;
    const completionRate = progActivations.length > 0
      ? Math.round((completed / progActivations.length) * 100)
      : 0;
    const avgDuration = progSessions.length > 0
      ? Math.round(progSessions.reduce((s: number, ss: any) => s + (ss.duration_seconds || 0), 0) / progSessions.length / 60)
      : 0;
    const uniqueUsers = new Set(progSessions.map((s: any) => s.user_id)).size;

    return {
      id: p.id,
      title: p.title,
      status: p.status,
      durationWeeks: p.duration_weeks,
      totalActivations: progActivations.length,
      activeUsers: active,
      completed,
      completionRate,
      totalSessions: progSessions.length,
      uniqueUsers,
      avgDuration,
    };
  });

  // Weekly session trend (last 12 weeks)
  const weeklyTrend: { week: string; sessions: number; users: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const weekSessions = (sessions || []).filter((s: any) => {
      const d = new Date(s.completed_at);
      return d >= weekStart && d < weekEnd;
    });

    weeklyTrend.push({
      week: label,
      sessions: weekSessions.length,
      users: new Set(weekSessions.map((s: any) => s.user_id)).size,
    });
  }

  return (
    <AnalyticsDashboard
      retentionData={retentionData}
      peakTimes={peakTimes}
      maxPeakPct={maxPeakPct}
      topExercises={topExercises}
      perProgram={perProgram}
      weeklyTrend={weeklyTrend}
      totalActivated={totalActivated}
      totalSessions={sessions?.length || 0}
      hasData={(sessions?.length || 0) > 0}
    />
  );
}

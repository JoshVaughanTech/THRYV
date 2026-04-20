import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RecordsDashboard } from './records-dashboard';

export default async function RecordsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: records } = await supabase
    .from('personal_records')
    .select('id, exercise_name, weight, reps, estimated_1rm, achieved_at')
    .eq('user_id', user.id)
    .order('achieved_at', { ascending: true });

  // Group all records by exercise
  const byExercise: Record<string, {
    name: string;
    best: { weight: number; reps: number; estimated_1rm: number; achieved_at: string };
    history: { weight: number; reps: number; estimated_1rm: number; achieved_at: string }[];
    totalPRs: number;
  }> = {};

  for (const r of records || []) {
    const e1rm = Number(r.estimated_1rm) || 0;
    if (!byExercise[r.exercise_name]) {
      byExercise[r.exercise_name] = {
        name: r.exercise_name,
        best: { weight: Number(r.weight), reps: r.reps, estimated_1rm: e1rm, achieved_at: r.achieved_at },
        history: [],
        totalPRs: 0,
      };
    }
    const entry = byExercise[r.exercise_name];
    entry.history.push({
      weight: Number(r.weight),
      reps: r.reps,
      estimated_1rm: e1rm,
      achieved_at: r.achieved_at,
    });
    entry.totalPRs += 1;
    if (e1rm > entry.best.estimated_1rm) {
      entry.best = { weight: Number(r.weight), reps: r.reps, estimated_1rm: e1rm, achieved_at: r.achieved_at };
    }
  }

  const exercises = Object.values(byExercise).sort((a, b) => b.best.estimated_1rm - a.best.estimated_1rm);

  return <RecordsDashboard exercises={exercises} />;
}

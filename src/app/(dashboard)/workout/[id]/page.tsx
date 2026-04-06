import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkoutTracker } from './workout-tracker';

export default async function WorkoutDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: workout } = await supabase
    .from('workouts')
    .select('*, programs(title, creator_id, creators(user_id, profiles:user_id(full_name))), program_weeks!inner(week_number)')
    .eq('id', id)
    .single();

  if (!workout) notFound();

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('workout_id', id)
    .order('order_index');

  const today = new Date().toISOString().split('T')[0];
  const { data: existingSession } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('workout_id', id)
    .gte('completed_at', `${today}T00:00:00`)
    .lte('completed_at', `${today}T23:59:59`)
    .limit(1)
    .single();

  const isCompleted = !!existingSession;
  const creatorName = (workout.programs as any)?.creators?.profiles?.full_name || 'Coach';
  const programTitle = (workout.programs as any)?.title || 'Program';
  const exerciseCount = exercises?.length || 0;
  const momentumReward = 10 + Math.floor(exerciseCount * 1.5);
  const weekNumber = (workout as any)?.program_weeks?.week_number;

  return (
    <WorkoutTracker
      workoutId={id}
      programId={workout.program_id}
      creatorId={(workout.programs as any)?.creator_id}
      workoutTitle={workout.title}
      programTitle={programTitle}
      creatorName={creatorName}
      weekNumber={weekNumber}
      dayNumber={workout.day_of_week || workout.order_index + 1}
      exercises={(exercises || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        rest_seconds: e.rest_seconds,
        rpe: e.rpe,
        notes: e.notes,
        video_url: e.video_url,
      }))}
      isCompleted={isCompleted}
      momentumReward={momentumReward}
    />
  );
}

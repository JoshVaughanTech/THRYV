import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompleteWorkoutButton } from './complete-button';
import { Clock, Play, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function WorkoutDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: workout } = await supabase
    .from('workouts')
    .select('*, programs(title, creator_id)')
    .eq('id', id)
    .single();

  if (!workout) notFound();

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('workout_id', id)
    .order('order_index');

  // Check if already completed today
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

  return (
    <div className="max-w-3xl">
      <Link
        href="/my-programs"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Programs
      </Link>

      {/* Workout Header */}
      <div className="mb-8">
        <p className="text-sm text-accent-primary mb-1">
          {(workout.programs as any)?.title}
        </p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">{workout.title}</h1>
        {workout.description && (
          <p className="text-text-secondary">{workout.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          {workout.estimated_duration && (
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <Clock className="h-4 w-4" />
              {workout.estimated_duration} min
            </span>
          )}
          {exercises && (
            <span className="text-sm text-text-muted">
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
            </span>
          )}
          {isCompleted && <Badge variant="success">Completed Today</Badge>}
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4 mb-8">
        {exercises && exercises.length > 0 ? (
          exercises.map((exercise: any, index: number) => (
            <Card key={exercise.id} className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0 text-sm font-bold text-text-muted">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text-primary mb-1">{exercise.name}</h3>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  {exercise.sets && <span>{exercise.sets} sets</span>}
                  {exercise.reps && <span>{exercise.reps} reps</span>}
                </div>
                {exercise.notes && (
                  <p className="text-xs text-text-muted mt-2">{exercise.notes}</p>
                )}
                {exercise.video_url && (
                  <a
                    href={exercise.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-primary-hover mt-2 transition-colors"
                  >
                    <Play className="h-3 w-3" />
                    Watch Demo
                  </a>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="text-center py-8">
            <p className="text-sm text-text-muted">No exercises listed for this workout</p>
          </Card>
        )}
      </div>

      {/* Complete Button */}
      <CompleteWorkoutButton
        workoutId={id}
        programId={workout.program_id}
        creatorId={(workout.programs as any)?.creator_id}
        isCompleted={isCompleted}
      />
    </div>
  );
}

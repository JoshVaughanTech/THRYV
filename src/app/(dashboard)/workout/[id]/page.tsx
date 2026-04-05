import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CompleteWorkoutButton } from './complete-button';
import { ArrowLeft, Clock, Play, Zap } from 'lucide-react';
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
    .select('*, programs(title, creator_id, creators(user_id, profiles:user_id(full_name)))')
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

  return (
    <div className="max-w-3xl lg:mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/my-programs" className="p-1">
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <span className="text-white font-semibold text-[15px] flex-1">{workout.title}</span>
      </div>

      {/* Creator / Program info */}
      <div className="flex items-center gap-2 mb-5 px-1">
        <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[#2A2A1A] to-[#1A1A0A] flex items-center justify-center">
          <span className="text-[#B4F000] text-[7px] font-extrabold">
            {creatorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </span>
        </div>
        <span className="text-[#555555] text-[11px]">{creatorName} · {programTitle}</span>
      </div>

      {/* Stats Row */}
      <div className="flex gap-2.5 mb-5">
        {[
          { value: String(exerciseCount), label: 'Exercises', color: 'white' },
          { value: `~${workout.estimated_duration || 45}`, label: 'Minutes', color: 'white' },
          { value: `+${momentumReward}`, label: 'Momentum', color: '#B4F000' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex-1 bg-[#141414] border border-[#1E1E1E] rounded-[10px] py-[9px] text-center"
          >
            <div className="text-[17px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[#555555] text-[8px] uppercase tracking-[0.5px]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Exercise List */}
      <div className="space-y-[7px] mb-24">
        {exercises && exercises.length > 0 ? (
          exercises.map((exercise: any, index: number) => (
            <div
              key={exercise.id}
              className="bg-[#141414] rounded-[14px] border border-[#1E1E1E] p-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-2.5 items-center">
                  <div className="w-8 h-8 rounded-lg bg-[#1A1A2A] flex items-center justify-center text-[#7799DD] text-[13px] font-extrabold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white text-[13px] font-semibold">{exercise.name}</div>
                    <div className="text-[#555555] text-[10px] mt-0.5">
                      {exercise.sets && `${exercise.sets} sets`}
                      {exercise.reps && ` · ${exercise.reps} reps`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags row */}
              {(exercise.rest_seconds || exercise.rpe || exercise.video_url) && (
                <div className="flex items-center gap-[5px] mt-2 pt-2 border-t border-[#1E1E1E]">
                  {exercise.rest_seconds && (
                    <span className="bg-[#1A1A1A] text-[#888888] text-[8px] px-[7px] py-[3px] rounded-[5px]">
                      Rest: {exercise.rest_seconds}s
                    </span>
                  )}
                  {exercise.rpe && (
                    <span className="bg-[#1A1A1A] text-[#888888] text-[8px] px-[7px] py-[3px] rounded-[5px]">
                      RPE {exercise.rpe}
                    </span>
                  )}
                  {exercise.video_url && (
                    <a
                      href={exercise.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-[3px]"
                    >
                      <Play className="h-[10px] w-[10px] text-[#555555]" />
                      <span className="text-[#555555] text-[9px] font-semibold">VIDEO</span>
                    </a>
                  )}
                </div>
              )}

              {/* Notes */}
              {exercise.notes && (
                <p className="text-[10px] text-[#555555] mt-1.5 italic">{exercise.notes}</p>
              )}
            </div>
          ))
        ) : (
          <div className="bg-[#141414] rounded-[14px] border border-[#1E1E1E] text-center py-8">
            <p className="text-sm text-[#555555]">No exercises listed</p>
          </div>
        )}
      </div>

      {/* Complete Button - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 lg:relative lg:mt-4 z-30">
        <div className="bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent px-5 py-5 pb-9 lg:p-0 lg:bg-none">
          <CompleteWorkoutButton
            workoutId={id}
            programId={workout.program_id}
            creatorId={(workout.programs as any)?.creator_id}
            isCompleted={isCompleted}
            exerciseCount={exerciseCount}
            momentumReward={momentumReward}
          />
        </div>
      </div>
    </div>
  );
}

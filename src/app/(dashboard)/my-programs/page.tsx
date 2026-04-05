import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight, Clock, Dumbbell, Zap, Play } from 'lucide-react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default async function MyProgramsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: activations } = await supabase
    .from('program_activations')
    .select('*, programs(*, creators(*, profiles:user_id(full_name)))')
    .eq('user_id', user.id)
    .order('activated_at', { ascending: false });

  const activePrograms = activations?.filter((a: any) => a.is_active) || [];

  // Gather workouts for current week of each active program
  const weeklyWorkouts: any[] = [];
  for (const activation of activePrograms) {
    const { data: weeks } = await supabase
      .from('program_weeks')
      .select('*, workouts(*)')
      .eq('program_id', activation.program_id)
      .eq('week_number', activation.current_week)
      .single();

    if (weeks?.workouts) {
      for (const workout of weeks.workouts) {
        weeklyWorkouts.push({
          ...workout,
          programTitle: activation.programs?.title,
          programId: activation.program_id,
          activationId: activation.id,
        });
      }
    }
  }

  // Get all completed sessions for the current week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const { data: weekSessions } = await supabase
    .from('workout_sessions')
    .select('workout_id, completed_at')
    .eq('user_id', user.id)
    .gte('completed_at', monday.toISOString())
    .lte('completed_at', sunday.toISOString());

  const completedWorkoutIds = new Set(weekSessions?.map((s: any) => s.workout_id) || []);

  // Figure out which days have completions
  const completedDays = new Set<number>();
  weekSessions?.forEach((s: any) => {
    const d = new Date(s.completed_at);
    let dow = d.getDay(); // 0=Sun
    dow = dow === 0 ? 7 : dow; // convert to 1=Mon, 7=Sun
    completedDays.add(dow);
  });

  // Today as 1=Mon, 7=Sun
  const todayDow = now.getDay() === 0 ? 7 : now.getDay();

  // Group workouts by day_of_week
  const workoutsByDay = new Map<number, any[]>();
  for (const wo of weeklyWorkouts) {
    const day = wo.day_of_week || wo.order_index + 1;
    if (!workoutsByDay.has(day)) workoutsByDay.set(day, []);
    workoutsByDay.get(day)!.push(wo);
  }

  // Find "up next" workout
  const upNext = weeklyWorkouts
    .filter((w) => !completedWorkoutIds.has(w.id))
    .sort((a, b) => (a.day_of_week || a.order_index + 1) - (b.day_of_week || b.order_index + 1))[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">My Programs</h1>
        <p className="text-text-secondary mt-1">Your weekly training plan</p>
      </div>

      {/* Calendar Week View */}
      {weeklyWorkouts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent-primary" />
            This Week
          </h2>

          {/* Day indicators */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {DAY_LABELS.map((label, i) => {
              const dayNum = i + 1; // 1=Mon, 7=Sun
              const isToday = dayNum === todayDow;
              const isCompleted = completedDays.has(dayNum);
              const hasWorkout = workoutsByDay.has(dayNum);
              const isPast = dayNum < todayDow;

              return (
                <div key={label} className="text-center">
                  <p className={`text-[10px] uppercase tracking-[1px] mb-1.5 ${
                    isToday ? 'text-accent-primary font-bold' : 'text-text-muted'
                  }`}>
                    {label}
                  </p>
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isCompleted
                      ? 'bg-accent-primary text-[#0A0A0A]'
                      : isToday
                        ? 'border-2 border-accent-primary text-accent-primary'
                        : hasWorkout && isPast
                          ? 'bg-error/10 text-error'
                          : hasWorkout
                            ? 'bg-[#1E1E1E] text-text-secondary'
                            : 'bg-transparent text-text-hint'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{monday.getDate() + i}</span>
                    )}
                  </div>
                  {hasWorkout && (
                    <div className="flex justify-center gap-0.5 mt-1.5">
                      {workoutsByDay.get(dayNum)!.map((_, wi) => (
                        <div key={wi} className={`w-1 h-1 rounded-full ${
                          isCompleted ? 'bg-accent-primary' : 'bg-text-muted'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Up Next Card */}
          {upNext && (
            <Link href={`/workout/${upNext.id}`}>
              <Card hover className="mb-6 border-accent-primary/20 bg-accent-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center">
                      <Play className="h-5 w-5 text-[#0A0A0A] ml-0.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-accent-primary uppercase tracking-[1px] font-medium mb-0.5">Up Next</p>
                      <p className="font-semibold text-text-primary">{upNext.title}</p>
                      <p className="text-xs text-text-muted">{upNext.programTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {upNext.estimated_duration && (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        {upNext.estimated_duration}m
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-accent-primary" />
                  </div>
                </div>
              </Card>
            </Link>
          )}

          {/* All workouts list */}
          <div className="space-y-2">
            {weeklyWorkouts
              .sort((a, b) => (a.day_of_week || a.order_index + 1) - (b.day_of_week || b.order_index + 1))
              .map((workout) => {
                const isCompleted = completedWorkoutIds.has(workout.id);
                const isUpNext = upNext?.id === workout.id;
                const wDay = workout.day_of_week || workout.order_index + 1;
                const dayLabel = DAY_LABELS[(wDay - 1) % 7] || '';

                return (
                  <Link key={workout.id} href={`/workout/${workout.id}`}>
                    <Card hover className={`flex items-center justify-between ${isCompleted ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isCompleted
                            ? 'bg-success/10'
                            : 'bg-[#1E1E1E]'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <Dumbbell className="h-5 w-5 text-text-muted" />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${isCompleted ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                            {workout.title}
                          </p>
                          <p className="text-xs text-text-muted">
                            {dayLabel} &middot; {workout.programTitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {workout.estimated_duration && (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Clock className="h-3 w-3" />
                            {workout.estimated_duration}m
                          </span>
                        )}
                        {isCompleted ? (
                          <Badge variant="success">Done</Badge>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-text-muted" />
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Active Programs */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Active Programs</h2>
        {activePrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePrograms.map((activation: any) => (
              <Link key={activation.id} href={`/programs/${activation.program_id}`}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-text-primary">
                      {activation.programs?.title}
                    </h3>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-sm text-text-muted mb-3">
                    by {activation.programs?.creators?.profiles?.full_name || 'Coach'}
                  </p>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>Week {activation.current_week}</span>
                      <span>of {activation.programs?.duration_weeks}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full momentum-gradient transition-all"
                        style={{
                          width: `${(activation.current_week / (activation.programs?.duration_weeks || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Zap className="h-8 w-8 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted mb-2">No active programs</p>
            <Link
              href="/programs"
              className="text-sm text-accent-primary hover:text-accent-primary-hover transition-colors"
            >
              Browse Programs
            </Link>
          </Card>
        )}
      </div>

      {/* Completed Programs */}
      {activations && activations.filter((a: any) => !a.is_active).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activations
              .filter((a: any) => !a.is_active)
              .map((activation: any) => (
                <Card key={activation.id} className="opacity-60">
                  <h3 className="font-semibold text-text-primary mb-1">
                    {activation.programs?.title}
                  </h3>
                  <Badge>Completed</Badge>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

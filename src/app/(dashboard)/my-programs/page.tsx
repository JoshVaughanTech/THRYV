import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Zap, Clock, ChevronRight, Check } from 'lucide-react';

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

  const { data: momentum } = await supabase.rpc('get_momentum_total', { p_user_id: user.id });
  const { data: streak } = await supabase.from('streaks').select('*').eq('user_id', user.id).single();

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
        const creatorName = activation.programs?.creators?.profiles?.full_name || 'Coach';
        const initials = creatorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        weeklyWorkouts.push({
          ...workout,
          programTitle: activation.programs?.title,
          programId: activation.program_id,
          creatorInitials: initials,
          weekNumber: activation.current_week,
          totalWeeks: activation.programs?.duration_weeks,
        });
      }
    }
  }

  // Week sessions
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const { data: weekSessions } = await supabase
    .from('workout_sessions')
    .select('workout_id, completed_at, duration_seconds')
    .eq('user_id', user.id)
    .gte('completed_at', monday.toISOString())
    .lte('completed_at', sunday.toISOString());

  const completedWorkoutIds = new Set(weekSessions?.map((s: any) => s.workout_id) || []);
  const completedDays = new Set<number>();
  weekSessions?.forEach((s: any) => {
    const d = new Date(s.completed_at);
    let dow = d.getDay();
    dow = dow === 0 ? 7 : dow;
    completedDays.add(dow);
  });

  const todayDow = now.getDay() === 0 ? 7 : now.getDay();
  const completedCount = completedWorkoutIds.size;
  const totalThisWeek = weeklyWorkouts.length;

  // Up next workout
  const upNext = weeklyWorkouts
    .filter((w) => !completedWorkoutIds.has(w.id))
    .sort((a, b) => (a.day_of_week || a.order_index + 1) - (b.day_of_week || b.order_index + 1))[0];

  // Upcoming (not completed, not up-next)
  const upcoming = weeklyWorkouts
    .filter((w) => !completedWorkoutIds.has(w.id) && w.id !== upNext?.id)
    .sort((a, b) => (a.day_of_week || a.order_index + 1) - (b.day_of_week || b.order_index + 1));

  // Completed workouts
  const completed = weeklyWorkouts.filter((w) => completedWorkoutIds.has(w.id));

  const todayLabel = now.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[#555555] text-[10px] uppercase tracking-[1.5px]">
              Week {activePrograms[0]?.current_week || 1} of {activePrograms[0]?.programs?.duration_weeks || '—'}
            </div>
            <div className="text-white text-xl font-bold mt-0.5">My training</div>
          </div>
          <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl px-3 py-1.5 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[#B4F000]" />
            <span className="text-[#B4F000] text-[13px] font-bold">{(momentum || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Streak + Progress badges */}
      <div className="px-5 py-1.5 flex gap-1.5">
        {(streak?.current_streak || 0) > 0 && (
          <div className="flex items-center gap-1 bg-[#1A1400] border border-[#3D3000] rounded-lg px-2.5 py-[5px]">
            <span className="text-[#F0A000] text-[10px] font-bold">🔥 {streak.current_streak} day streak</span>
          </div>
        )}
        <div className="bg-[#141414] border border-[#1E1E1E] rounded-lg px-2.5 py-[5px]">
          <span className="text-[#888888] text-[10px] font-semibold">{completedCount} of {totalThisWeek} complete</span>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="px-5 py-2 flex justify-between">
        {DAY_LABELS.map((label, i) => {
          const dayNum = i + 1;
          const isToday = dayNum === todayDow;
          const isDone = completedDays.has(dayNum);

          return (
            <div key={label} className="text-center w-[38px]">
              <div className="text-[#555555] text-[9px] uppercase">{label}</div>
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[12px] font-semibold mx-auto mt-1"
                style={{
                  background: isDone ? '#B4F000' : isToday ? 'transparent' : '#1A1A1A',
                  border: isToday ? '2px solid #B4F000' : 'none',
                  color: isDone ? '#0A0A0A' : isToday ? '#FFFFFF' : '#555555',
                  fontWeight: isDone || isToday ? 700 : 600,
                }}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  monday.getDate() + i
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Today label */}
      <div className="px-5 py-1.5">
        <span className="text-[#555555] text-[10px] font-semibold uppercase tracking-[1px]">
          Today — {todayLabel}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="px-5 pb-24 space-y-2">
        {/* Up Next */}
        {upNext && (
          <Link href={`/workout/${upNext.id}`}>
            <div className="bg-[#141414] rounded-2xl p-4 border border-[#B4F000] relative mb-2">
              <div className="absolute top-3 right-3 bg-[#1A2A0A] border border-[#2A4A0A] rounded-lg px-2 py-[3px]">
                <span className="text-[#B4F000] text-[8px] font-bold tracking-[0.5px]">UP NEXT</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-[#2A2A1A] to-[#1A1A0A] flex items-center justify-center">
                  <span className="text-[#B4F000] text-[9px] font-extrabold">{upNext.creatorInitials}</span>
                </div>
                <span className="text-[#555555] text-[10px]">{upNext.programTitle} · Week {upNext.weekNumber}</span>
              </div>
              <div className="text-white text-[15px] font-bold mb-[3px]">{upNext.title}</div>
              <div className="text-[#555555] text-[11px] mb-3">
                {upNext.exercises?.length || '—'} exercises · ~{upNext.estimated_duration || 45} min
              </div>
              <div className="w-full py-[11px] bg-[#B4F000] text-[#0A0A0A] rounded-[10px] text-center text-[12px] font-bold tracking-[0.5px]">
                START WORKOUT
              </div>
            </div>
          </Link>
        )}

        {/* Upcoming */}
        {upcoming.map((workout) => {
          const wDay = workout.day_of_week || workout.order_index + 1;
          const dayLabel = DAY_LABELS[(wDay - 1) % 7]?.toUpperCase() || '';

          return (
            <Link key={workout.id} href={`/workout/${workout.id}`}>
              <div className="bg-[#141414] rounded-[14px] p-3 border border-[#1E1E1E] opacity-60 mb-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2A1A2A] to-[#1A0A1A] flex items-center justify-center">
                    <span className="text-[#B477D9] text-[8px] font-extrabold">{workout.creatorInitials}</span>
                  </div>
                  <span className="text-[#555555] text-[10px]">{workout.programTitle} · Week {workout.weekNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[#999999] text-[13px] font-semibold">{workout.title}</div>
                    <div className="text-[#555555] text-[10px]">
                      {workout.exercises?.length || '—'} exercises · ~{workout.estimated_duration || 45} min
                    </div>
                  </div>
                  <span className="text-[#444444] text-[10px] font-semibold">{dayLabel}</span>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <div className="text-[#333333] text-[10px] uppercase tracking-[1px] font-semibold pt-3 pb-1">
              Completed
            </div>
            {completed.map((workout) => (
              <div key={workout.id} className="bg-[#141414] rounded-[14px] p-3 border border-[#1E1E1E] mb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[26px] h-[26px] rounded-full bg-[#B4F000] flex items-center justify-center">
                      <Check className="h-[13px] w-[13px] text-[#0A0A0A]" strokeWidth={3} />
                    </div>
                    <div>
                      <div className="text-[#888888] text-[13px] font-semibold">{workout.title}</div>
                      <div className="text-[#444444] text-[10px]">{workout.programTitle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#B4F000] text-[12px] font-bold">+10</div>
                    <div className="text-[#555555] text-[8px]">MOMENTUM</div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {weeklyWorkouts.length === 0 && (
          <div className="text-center py-16">
            <Zap className="h-8 w-8 text-[#555555] mx-auto mb-3" />
            <p className="text-[#888888] mb-2">No active programs</p>
            <Link href="/programs" className="text-sm text-[#B4F000] hover:text-[#C5F53A] transition-colors">
              Browse Programs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Clock, Dumbbell, Calendar } from 'lucide-react';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch workout sessions joined with workouts and programs, ordered by most recent
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      completed_at,
      duration_seconds,
      workout_id,
      program_id,
      workouts(title),
      programs(title)
    `)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(50);

  // Fetch set_logs volume for each session
  const sessionIds = (sessions || []).map((s: any) => s.id);
  let volumeMap: Record<string, number> = {};
  if (sessionIds.length > 0) {
    const { data: setLogs } = await supabase
      .from('set_logs')
      .select('session_id, weight, reps, completed')
      .in('session_id', sessionIds);

    if (setLogs) {
      for (const log of setLogs) {
        if (!log.completed) continue;
        const vol = (Number(log.weight) || 0) * (Number(log.reps) || 0);
        volumeMap[log.session_id] = (volumeMap[log.session_id] || 0) + vol;
      }
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return '--';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  }

  const isEmpty = !sessions || sessions.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#f0f0f5]">Workout History</h1>
        <p className="text-xs text-[#6b6b80] mt-1">Your recent training sessions</p>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#15151f] border border-[#2a2a3a] flex items-center justify-center mb-4">
            <Dumbbell className="h-7 w-7 text-[#6b6b80]" />
          </div>
          <p className="text-sm font-semibold text-[#a0a0b8] mb-1">No workouts yet</p>
          <p className="text-xs text-[#6b6b80] text-center max-w-[240px]">
            Complete your first workout to start tracking your history.
          </p>
        </div>
      ) : (
        /* Session List */
        <div className="space-y-2">
          {sessions.map((session: any) => {
            const workoutName = session.workouts?.title || 'Workout';
            const programName = session.programs?.title || 'Program';
            const volume = volumeMap[session.id];
            const durationStr = formatDuration(session.duration_seconds);
            const dateStr = formatDate(session.completed_at);

            return (
              <div
                key={session.id}
                className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-4 transition-colors hover:border-[#3a3a4a]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#f0f0f5] truncate">
                      {workoutName}
                    </p>
                    <p className="text-[11px] text-[#6b6b80] mt-0.5">{programName}</p>
                  </div>
                  <span className="text-[11px] text-[#6b6b80] flex items-center gap-1 flex-shrink-0 ml-3">
                    <Calendar className="h-3 w-3" />
                    {dateStr}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-[#00E5CC]" />
                    <span className="text-[11px] font-medium text-[#a0a0b8]">{durationStr}</span>
                  </div>
                  {volume !== undefined && volume > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="h-3 w-3 text-[#00E5CC]" />
                      <span className="text-[11px] font-medium text-[#a0a0b8]">
                        {volume.toLocaleString()} lb
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

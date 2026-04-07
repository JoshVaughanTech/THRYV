import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Trophy, TrendingUp } from 'lucide-react';

export default async function RecordsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: records } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .order('estimated_1rm', { ascending: false });

  // Group by exercise_name, keeping only the best record per exercise
  const bestByExercise = new Map<string, any>();
  for (const record of records || []) {
    const existing = bestByExercise.get(record.exercise_name);
    if (!existing || (Number(record.estimated_1rm) || 0) > (Number(existing.estimated_1rm) || 0)) {
      bestByExercise.set(record.exercise_name, record);
    }
  }

  const prCards = Array.from(bestByExercise.values());

  // Determine which PRs are recent (within last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  function isRecent(dateStr: string) {
    return new Date(dateStr) >= sevenDaysAgo;
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const isEmpty = prCards.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-[#6c5ce7]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#f0f0f5]">Personal Records</h1>
          <p className="text-xs text-[#6b6b80] mt-0.5">
            {isEmpty ? 'No PRs yet' : `${prCards.length} exercise${prCards.length !== 1 ? 's' : ''} tracked`}
          </p>
        </div>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#15151f] border border-[#2a2a3a] flex items-center justify-center mb-4">
            <Trophy className="h-7 w-7 text-[#6b6b80]" />
          </div>
          <p className="text-sm font-semibold text-[#a0a0b8] mb-1">No personal records yet</p>
          <p className="text-xs text-[#6b6b80] text-center max-w-[260px]">
            Complete workouts with logged weights and reps to start tracking PRs.
          </p>
        </div>
      ) : (
        /* PR Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prCards.map((pr: any) => {
            const recent = isRecent(pr.achieved_at);
            const e1rm = Number(pr.estimated_1rm) || 0;

            return (
              <div
                key={pr.id}
                className={`rounded-2xl border bg-[#15151f] p-4 transition-colors ${
                  recent
                    ? 'border-[#6c5ce7]/50 shadow-[0_0_12px_rgba(108,92,231,0.08)]'
                    : 'border-[#2a2a3a]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[13px] font-semibold text-[#f0f0f5] leading-tight flex-1 min-w-0 pr-2">
                    {pr.exercise_name}
                  </p>
                  {recent && (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 px-2 py-0.5 text-[9px] font-bold text-[#6c5ce7] uppercase tracking-wider">
                      New
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-[#f0f0f5]">{Number(pr.weight)}</span>
                  <span className="text-xs text-[#6b6b80]">lb</span>
                  <span className="text-sm text-[#6b6b80] mx-1">&times;</span>
                  <span className="text-2xl font-bold text-[#ffab00]">{pr.reps}</span>
                  <span className="text-xs text-[#6b6b80]">reps</span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a3a]">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-[#6c5ce7]" />
                    <span className="text-[11px] font-medium text-[#a0a0b8]">
                      Est. 1RM: {Math.round(e1rm)} lb
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6b6b80]">{formatDate(pr.achieved_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

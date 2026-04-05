import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight, LogOut, Settings } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: subscription },
    { data: streak },
    { data: creditBalance },
    { data: momentum },
    { data: recentMomentum },
    { data: creditHistory },
    { count: sessionCount },
    { data: recentSessions },
    { data: activations },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('streaks').select('*').eq('user_id', user.id).single(),
    supabase.rpc('get_credit_balance', { p_user_id: user.id }),
    supabase.rpc('get_momentum_total', { p_user_id: user.id }),
    supabase
      .from('momentum_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('credit_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('workout_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(30),
    supabase
      .from('program_activations')
      .select('*, programs(*, creators(*, profiles:user_id(full_name)))')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ]);

  const momentumLevel = Math.floor((momentum || 0) / 100) + 1;

  const activePrograms = activations || [];

  // Format member-since date
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  // Next billing date
  const nextBilling = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  // Initials from full name
  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n: string) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* ── Avatar Section ── */}
      <section className="flex flex-col items-center pt-6 pb-8">
        <div className="relative mb-3">
          <div className="w-[72px] h-[72px] rounded-full border-2 border-[#B4F000] bg-gradient-to-br from-[#B4F000]/30 to-[#7ED957]/20 flex items-center justify-center text-2xl font-bold text-white">
            {initials}
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">
          {profile?.full_name || 'Athlete'}
        </h1>
        <p className="text-sm text-[#666] mt-0.5">Member since {memberSince}</p>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-3">
          <span className="inline-flex items-center rounded-full bg-[#B4F000]/10 border border-[#B4F000]/20 px-3 py-1 text-xs font-semibold text-[#B4F000] tracking-wide">
            LEVEL {momentumLevel}
          </span>
          {(streak?.current_streak ?? 0) > 0 && (
            <span className="inline-flex items-center rounded-full bg-[#F0A000]/10 border border-[#F0A000]/20 px-3 py-1 text-xs font-semibold text-[#F0A000] tracking-wide">
              {streak?.current_streak} DAY STREAK
            </span>
          )}
        </div>
      </section>

      {/* ── Subscription Card ── */}
      <section className="mb-6">
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E1E]">
            <h2 className="text-base font-semibold text-white">Subscription</h2>
            <span className="inline-flex items-center rounded-full bg-[#B4F000]/10 border border-[#B4F000]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#B4F000] uppercase tracking-wider">
              {subscription?.status || 'None'}
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#1E1E1E]">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-[#666]">Plan</span>
              <span className="text-sm font-medium text-white">
                THRYV Pro &middot; $19.99/mo
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-[#666]">Next billing date</span>
              <span className="text-sm text-white">{nextBilling}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-[#666]">Credits remaining</span>
              <span className="text-sm font-semibold text-[#B4F000]">
                {creditBalance ?? 0}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Active Programs ── */}
      <section className="mb-6">
        <h3 className="text-[11px] font-semibold text-[#666] uppercase tracking-[1.5px] mb-3 px-1">
          Active Programs
        </h3>

        {activePrograms.length > 0 ? (
          <div className="space-y-3">
            {activePrograms.map((activation: any) => {
              const program = activation.programs;
              const totalWeeks = program?.duration_weeks || 1;
              const currentWeek = activation.current_week || 1;
              const progressPct = Math.round((currentWeek / totalWeeks) * 100);
              const creatorName =
                program?.creators?.profiles?.full_name || 'Coach';
              const programInitials = (program?.title || 'P')
                .split(' ')
                .map((w: string) => w.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <Link
                  key={activation.id}
                  href={`/programs/${activation.program_id}`}
                >
                  <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-4 hover:border-[#2A2A2A] transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B4F000]/30 to-[#7ED957]/20 flex items-center justify-center text-xs font-bold text-[#B4F000] flex-shrink-0">
                        {programInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {program?.title}
                        </p>
                        <p className="text-xs text-[#666]">
                          Week {currentWeek} of {totalWeeks} &middot;{' '}
                          {creatorName}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#B4F000] flex-shrink-0">
                        {progressPct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1E1E1E] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#B4F000] transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6 text-center">
            <p className="text-sm text-[#666] mb-2">No active programs</p>
            <Link
              href="/programs"
              className="text-sm text-[#B4F000] hover:underline"
            >
              Browse Programs
            </Link>
          </div>
        )}
      </section>

      {/* ── Credit Ledger ── */}
      <section className="mb-6">
        <h3 className="text-[11px] font-semibold text-[#666] uppercase tracking-[1.5px] mb-3 px-1">
          Credit Ledger
        </h3>

        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] overflow-hidden">
          {creditHistory && creditHistory.length > 0 ? (
            <div className="divide-y divide-[#1E1E1E]">
              {creditHistory.map((entry: any) => {
                const isPositive = entry.amount >= 0;
                const dateStr = new Date(entry.created_at).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric' }
                );
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="text-sm text-white capitalize truncate">
                        {entry.event_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-[#666]">{dateStr}</p>
                    </div>
                    <span
                      className={`text-sm font-semibold flex-shrink-0 ${
                        isPositive ? 'text-[#B4F000]' : 'text-[#E24B4A]'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {entry.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-[#666]">No credit history yet</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Settings + Logout ── */}
      <section>
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] overflow-hidden">
          <Link href="/settings">
            <div className="flex items-center justify-between px-5 py-4 hover:bg-[#1A1A1A] transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-[#666]" />
                <span className="text-sm font-medium text-white">Settings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#666]" />
            </div>
          </Link>
          <div className="border-t border-[#1E1E1E]" />
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-5 py-4 w-full text-left hover:bg-[#1A1A1A] transition-colors"
            >
              <LogOut className="h-5 w-5 text-[#E24B4A]" />
              <span className="text-sm font-medium text-[#E24B4A]">
                Log out
              </span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

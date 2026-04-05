import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  Search,
  Bell,
  Flame,
  TrendingUp,
  Coins,
  Dumbbell,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CoachCardCarousel } from '@/components/ui/coach-card-carousel';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: subscription },
    { data: activations },
    { data: streak },
    { data: coaches },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase
      .from('program_activations')
      .select('*, programs(*)')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase.from('streaks').select('*').eq('user_id', user.id).single(),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, bio, specialties, follower_count, program_count, session_count, tier')
      .in('role', ['coach', 'admin'])
      .order('follower_count', { ascending: false })
      .limit(10),
  ]);

  // Get credit balance
  const { data: creditBalance } = await supabase.rpc('get_credit_balance', {
    p_user_id: user.id,
  });

  // Get total momentum
  const { data: momentum } = await supabase.rpc('get_momentum_total', {
    p_user_id: user.id,
  });

  const filterPills = ['ALL', 'STRENGTH', 'HYBRID', 'CARDIO', 'HIIT'];

  // Build trending programs from active programs data, or show placeholder items
  const trendingPrograms = activations && activations.length > 0
    ? activations.slice(0, 3).map((a: any) => ({
        id: a.id,
        title: a.programs?.title || 'Program',
        duration: a.programs?.duration_weeks
          ? `${a.programs.duration_weeks} wks`
          : '—',
      }))
    : [
        { id: '1', title: 'Shred 30', duration: '4 wks' },
        { id: '2', title: 'Power Build', duration: '8 wks' },
        { id: '3', title: 'HIIT Blitz', duration: '6 wks' },
      ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-[#6c5ce7]" />
          <span className="text-lg font-bold tracking-wide text-white">
            THRYV
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2a3a]">
            <Search className="h-4 w-4 text-[#a0a0b8]" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2a3a]">
            <Bell className="h-4 w-4 text-[#a0a0b8]" />
          </button>
        </div>
      </header>

      {/* ── Stats Badges ── */}
      <div className="flex items-center gap-3 overflow-x-auto px-5 pb-4 scrollbar-none">
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#2a2a3a] bg-[#15151f] px-3 py-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-[#6c5ce7]" />
          <span className="text-xs font-semibold text-white">
            {momentum || 0}
          </span>
          <span className="text-[10px] text-[#6b6b80]">MOM</span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#2a2a3a] bg-[#15151f] px-3 py-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-xs font-semibold text-white">
            {streak?.current_streak || 0}
          </span>
          <span className="text-[10px] text-[#6b6b80]">DAY</span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#2a2a3a] bg-[#15151f] px-3 py-1.5">
          <Coins className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-xs font-semibold text-white">
            {creditBalance ?? 0}
          </span>
          <span className="text-[10px] text-[#6b6b80]">CR</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-6 border-b border-[#2a2a3a] px-5">
        <button className="relative pb-3 text-sm font-bold tracking-widest text-white">
          MARKETPLACE
          <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#6c5ce7]" />
        </button>
        <Link
          href="/programs"
          className="pb-3 text-sm font-bold tracking-widest text-[#6b6b80] hover:text-[#a0a0b8] transition-colors"
        >
          PROGRAMS
        </Link>
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-none">
        {filterPills.map((pill, i) => (
          <span
            key={pill}
            className={
              i === 0
                ? 'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold bg-[#6c5ce7] text-white'
                : 'flex-shrink-0 rounded-full border border-[#2a2a3a] px-4 py-1.5 text-xs font-semibold text-[#a0a0b8]'
            }
          >
            {pill}
          </span>
        ))}
      </div>

      {/* ── Coach Carousel ── */}
      <section className="px-5 pb-6">
        <CoachCardCarousel coaches={coaches || []} />
      </section>

      {/* ── Trending Programs ── */}
      <section className="px-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Trending Programs</h2>
          <Link
            href="/programs"
            className="text-xs font-medium text-[#6c5ce7] hover:underline"
          >
            See all
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {trendingPrograms.map((program: any) => (
            <Link
              key={program.id}
              href="/programs"
              className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-4 text-center transition-colors hover:border-[#2a2a3a]"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#6c5ce7]/10">
                <Dumbbell className="h-5 w-5 text-[#6c5ce7]" />
              </div>
              <p className="text-xs font-semibold text-white truncate">
                {program.title}
              </p>
              <div className="mt-1 flex items-center justify-center gap-1 text-[#6b6b80]">
                <Clock className="h-3 w-3" />
                <span className="text-[10px]">{program.duration}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

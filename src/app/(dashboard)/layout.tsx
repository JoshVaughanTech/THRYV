import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  if (!profile.onboarding_completed) redirect('/onboarding');

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-[#1E1E1E] bg-[#0A0A0A]/95 backdrop-blur-xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text-primary tracking-tight">THRYV</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-accent-primary font-medium capitalize">{profile.role}</span>
        </div>
      </header>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar profile={profile} />
      </div>
      <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8 animate-fade-in">{children}</div>
      </main>
      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}

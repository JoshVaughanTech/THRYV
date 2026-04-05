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
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar profile={profile} />
      </div>
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="lg:mx-auto lg:max-w-6xl lg:px-8 lg:py-8 animate-fade-in">{children}</div>
      </main>
      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}

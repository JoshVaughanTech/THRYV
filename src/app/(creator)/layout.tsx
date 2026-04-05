import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreatorSidebar } from '@/components/layout/creator-sidebar';

export default async function CreatorLayout({
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
  if (profile.role !== 'creator' && profile.role !== 'admin') redirect('/home');

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <CreatorSidebar profile={profile} />
      <main className="pl-[260px]">
        <div className="px-8 py-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

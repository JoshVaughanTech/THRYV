import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Bell } from 'lucide-react';
import { SettingsForm } from './settings-form';
import { NotificationToggles } from './notification-toggles';

export default async function CreatorSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, created_at')
    .eq('id', user.id)
    .single();

  const { data: creator } = await supabase
    .from('creators')
    .select('bio, credentials, video_url')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/creator-signup');

  const fullName = profile?.full_name || 'Creator';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#a0a0b8] mt-1">Manage your creator profile and preferences.</p>
      </div>

      {/* Creator Profile Card */}
      <div className="max-w-[640px] rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6 mb-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full border-2 border-[#00E5CC] bg-[#1A2A0A] flex items-center justify-center">
            <span className="text-lg font-bold text-[#00E5CC]">{initials}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{fullName}</p>
            <p className="text-sm text-[#a0a0b8]">PRO Creator &middot; Joined {joinedDate}</p>
          </div>
        </div>

        <SettingsForm
          userId={user.id}
          initialName={fullName}
          initialBio={creator.bio || ''}
          initialCredentials={creator.credentials || ''}
          initialVideoUrl={creator.video_url || ''}
        />
      </div>

      {/* Notifications Card */}
      <div className="max-w-[640px] rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-[#a0a0b8]" />
          <h2 className="text-lg font-bold text-white">Notifications</h2>
        </div>
        <NotificationToggles />
      </div>
    </div>
  );
}

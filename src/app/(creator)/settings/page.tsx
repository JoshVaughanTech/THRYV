import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Bell, User } from 'lucide-react';

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

  if (!creator) redirect('/creator-onboarding');

  const fullName = profile?.full_name || 'Creator';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#888888] mt-1">
          Manage your creator profile and preferences.
        </p>
      </div>

      {/* Creator Profile Card */}
      <div className="max-w-[640px] rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6 mb-6">
        {/* Avatar + Identity */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full border-2 border-[#B4F000] bg-[#1A2A0A] flex items-center justify-center">
            <span className="text-lg font-bold text-[#B4F000]">{initials}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{fullName}</p>
            <p className="text-sm text-[#888888]">
              PRO Creator &middot; Joined {joinedDate}
            </p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-5">
          <ProfileField label="Display Name" value={fullName} />
          <ProfileField
            label="Bio"
            value={creator.bio || 'No bio set'}
            multiline
          />
          <ProfileField
            label="Specialties"
            value={creator.credentials || 'No specialties set'}
          />
          <ProfileField
            label="Video URL"
            value={creator.video_url || 'No video URL set'}
          />
        </div>
      </div>

      {/* Notifications Card */}
      <div className="max-w-[640px] rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-[#888888]" />
          <h2 className="text-lg font-bold text-white">Notifications</h2>
        </div>

        <div className="space-y-0">
          <ToggleRow label="New program activation" enabled />
          <ToggleRow label="Community comments" enabled />
          <ToggleRow label="Payout completed" enabled />
          <ToggleRow label="Weekly summary email" enabled={false} />
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-[#555555] uppercase tracking-[1px] font-medium mb-1.5">
        {label}
      </p>
      {multiline ? (
        <div className="w-full rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] px-4 py-3 text-sm text-[#CCCCCC] min-h-[80px] whitespace-pre-wrap">
          {value}
        </div>
      ) : (
        <div className="w-full rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] px-4 py-3 text-sm text-[#CCCCCC]">
          {value}
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#1E1E1E] last:border-b-0">
      <span className="text-sm text-white">{label}</span>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-[#B4F000]' : 'bg-[#333333]'
        }`}
      >
        <div
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </div>
    </div>
  );
}

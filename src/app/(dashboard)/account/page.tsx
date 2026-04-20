import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AccountForms } from './account-forms';
import { AvatarUpload } from '@/components/ui/avatar-upload';

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-lg mx-auto pb-24 px-4">
      <h1 className="text-2xl font-bold text-white pt-6 mb-1">
        Account Settings
      </h1>
      <p className="text-sm text-[#666] mb-8">
        Manage your email, password, and account preferences.
      </p>

      {/* Avatar */}
      <section className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-5 mb-6">
        <h2 className="text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-semibold mb-4">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <AvatarUpload
            currentAvatarUrl={profile?.avatar_url}
            fullName={profile?.full_name}
          />
          <div>
            <p className="text-sm text-[#a0a0b8]">Click to upload a new photo</p>
            <p className="text-xs text-[#4a4a5a] mt-0.5">JPG, PNG, GIF. Max 5MB.</p>
          </div>
        </div>
      </section>

      <AccountForms
        userEmail={user.email || ''}
        userName={profile?.full_name || 'User'}
      />
    </div>
  );
}

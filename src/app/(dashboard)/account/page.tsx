import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AccountForms } from './account-forms';

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
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

      <AccountForms
        userEmail={user.email || ''}
        userName={profile?.full_name || 'User'}
      />
    </div>
  );
}

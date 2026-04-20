'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SettingsFormProps {
  userId: string;
  initialName: string;
  initialBio: string;
  initialCredentials: string;
  initialVideoUrl: string;
}

export function SettingsForm({
  userId,
  initialName,
  initialBio,
  initialCredentials,
  initialVideoUrl,
}: SettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    await Promise.all([
      supabase.from('profiles').update({ full_name: name }).eq('id', userId),
      supabase.from('creators').update({
        bio,
        credentials,
        video_url: videoUrl || null,
      }).eq('user_id', userId),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-medium mb-1.5">
          Display Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-[#0a0a0f] border border-[#2a2a3a] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50"
        />
      </div>

      <div>
        <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-medium mb-1.5">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full rounded-xl bg-[#0a0a0f] border border-[#2a2a3a] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50 resize-none"
        />
      </div>

      <div>
        <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-medium mb-1.5">
          Specialties / Credentials
        </label>
        <input
          value={credentials}
          onChange={(e) => setCredentials(e.target.value)}
          className="w-full rounded-xl bg-[#0a0a0f] border border-[#2a2a3a] px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50"
        />
      </div>

      <div>
        <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-medium mb-1.5">
          Video URL
        </label>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/..."
          className="w-full rounded-xl bg-[#0a0a0f] border border-[#2a2a3a] px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-[#00E5CC] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00CCBB] transition-colors disabled:opacity-50 cursor-pointer"
      >
        {saved ? (
          <><Check className="h-4 w-4" /> Saved</>
        ) : saving ? (
          'Saving...'
        ) : (
          <><Save className="h-4 w-4" /> Save Changes</>
        )}
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Send, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NewPostFormProps {
  programs: { id: string; title: string }[];
}

export function NewPostForm({ programs }: NewPostFormProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [programId, setProgramId] = useState(programs[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !programId) return;
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { error: postError } = await supabase.from('posts').insert({
      program_id: programId,
      user_id: user.id,
      content: content.trim(),
    });

    if (postError) {
      setError(postError.message);
      setLoading(false);
      return;
    }

    setContent('');
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#6c5ce7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#7c6ff0] transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        New post
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">New Post</h2>
          <button onClick={() => setOpen(false)} className="text-[#6b6b80] hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-medium mb-1.5">Program</label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full rounded-xl bg-[#0a0a0f] border border-[#2a2a3a] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#6c5ce7]/50"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-medium mb-1.5">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              placeholder="Share an update with your community..."
              className="w-full rounded-xl bg-[#0a0a0f] border border-[#2a2a3a] px-4 py-3 text-sm text-white placeholder:text-[#4a4a5a] focus:outline-none focus:ring-1 focus:ring-[#6c5ce7]/50 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-[#ff5252] bg-[#ff5252]/10 border border-[#ff5252]/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6c5ce7] py-2.5 text-sm font-bold text-white hover:bg-[#7c6ff0] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}

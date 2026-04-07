'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MarkReadButtonProps {
  userId: string;
}

export function MarkReadButton({ userId }: MarkReadButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleMarkAllRead() {
    setLoading(true);
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      router.refresh();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleMarkAllRead}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-3 py-1.5 text-xs font-medium text-[#a0a0b8] transition-colors hover:border-[#6c5ce7] hover:text-[#6c5ce7] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <CheckCheck className="h-3.5 w-3.5" />
      {loading ? 'Marking...' : 'Mark all as read'}
    </button>
  );
}

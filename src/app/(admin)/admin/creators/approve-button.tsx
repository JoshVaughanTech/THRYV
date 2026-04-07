'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface ApproveButtonProps {
  creatorId: string;
  creatorUserId: string;
  approved: boolean;
}

export function ApproveButton({ creatorId, creatorUserId, approved }: ApproveButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading('approve');
    setError(null);

    const { error: updateError } = await supabase
      .from('creators')
      .update({ approved: true })
      .eq('id', creatorId);

    if (updateError) {
      setError(updateError.message);
      setLoading(null);
      return;
    }

    // Update the user's profile role to 'creator'
    await supabase
      .from('profiles')
      .update({ role: 'creator' })
      .eq('id', creatorUserId);

    // Send a notification to the creator
    await supabase.from('notifications').insert({
      user_id: creatorUserId,
      type: 'creator_approved',
      title: 'Creator Application Approved',
      body: 'Congratulations! Your creator application has been approved. You can now create and publish programs.',
      data: { creator_id: creatorId },
    });

    setLoading(null);
    router.refresh();
  }

  async function handleReject() {
    setLoading('reject');
    setError(null);

    // Delete the creator record
    const { error: deleteError } = await supabase
      .from('creators')
      .delete()
      .eq('id', creatorId);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(null);
      return;
    }

    // Reset the user's profile role back to 'user'
    await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', creatorUserId);

    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {!approved && (
        <Button
          size="sm"
          onClick={handleApprove}
          loading={loading === 'approve'}
          disabled={loading !== null}
          className="gap-1"
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </Button>
      )}

      <Button
        size="sm"
        variant="danger"
        onClick={handleReject}
        loading={loading === 'reject'}
        disabled={loading !== null}
        className="gap-1"
      >
        <X className="h-3.5 w-3.5" />
        {approved ? 'Revoke' : 'Reject'}
      </Button>

      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
    </div>
  );
}

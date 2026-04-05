'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ActivateButtonProps {
  programId: string;
  creditCost: number;
  creditBalance: number;
  isActivated: boolean;
}

export function ActivateButton({
  programId,
  creditCost,
  creditBalance,
  isActivated,
}: ActivateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleActivate() {
    if (creditBalance < creditCost) {
      setError('Not enough credits to activate this program.');
      return;
    }

    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get the creator_id for usage tracking
    const { data: program } = await supabase
      .from('programs')
      .select('creator_id')
      .eq('id', programId)
      .single();

    if (!program) {
      setError('Program not found.');
      setLoading(false);
      return;
    }

    // Deduct credits
    const { error: creditError } = await supabase.from('credit_ledger').insert({
      user_id: user.id,
      amount: -creditCost,
      event_type: 'program_activation',
      reference_id: programId,
      description: 'Program activation',
    });

    if (creditError) {
      setError('Failed to process credits.');
      setLoading(false);
      return;
    }

    // Create activation
    const { error: activationError } = await supabase.from('program_activations').insert({
      user_id: user.id,
      program_id: programId,
    });

    if (activationError) {
      setError('Failed to activate program.');
      setLoading(false);
      return;
    }

    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: user.id,
      program_id: programId,
      creator_id: program.creator_id,
      event_type: 'program_activation',
      value: creditCost,
    });

    router.refresh();
  }

  if (isActivated) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-5 py-3">
        <Check className="h-5 w-5 text-success" />
        <span className="text-sm font-medium text-success">Program Activated</span>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={handleActivate} loading={loading} size="lg" className="gap-2">
        <Zap className="h-4 w-4" />
        Activate Program — {creditCost} Credit{creditCost !== 1 ? 's' : ''}
      </Button>
      <p className="text-xs text-text-muted mt-2">
        You have {creditBalance} credit{creditBalance !== 1 ? 's' : ''} available
      </p>
      {error && (
        <p className="text-sm text-error mt-2">{error}</p>
      )}
    </div>
  );
}

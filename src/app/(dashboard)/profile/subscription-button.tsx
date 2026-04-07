'use client';

import { useState } from 'react';
import { CreditCard, ExternalLink } from 'lucide-react';

interface SubscriptionButtonProps {
  status: string | null;
  hasStripeCustomer: boolean;
}

export function SubscriptionButton({ status, hasStripeCustomer }: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    const endpoint = hasStripeCustomer && status === 'active'
      ? '/api/stripe/portal'
      : '/api/stripe/checkout';

    const res = await fetch(endpoint, { method: 'POST' });
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  if (status === 'active') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[#2a2a3a] bg-[#12121a] text-xs font-semibold text-[#a0a0b8] hover:bg-[#1a1a25] transition-colors cursor-pointer disabled:opacity-50"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {loading ? 'Loading...' : 'Manage Subscription'}
      </button>
    );
  }

  if (status === 'trial') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#6c5ce7] text-xs font-bold text-white hover:bg-[#7c6ff0] transition-colors cursor-pointer disabled:opacity-50"
      >
        <CreditCard className="h-3.5 w-3.5" />
        {loading ? 'Loading...' : 'Upgrade to Pro — $19.99/mo'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#6c5ce7] text-xs font-bold text-white hover:bg-[#7c6ff0] transition-colors cursor-pointer disabled:opacity-50"
    >
      <CreditCard className="h-3.5 w-3.5" />
      {loading ? 'Loading...' : 'Subscribe — $19.99/mo'}
    </button>
  );
}

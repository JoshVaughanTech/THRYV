'use client';

import { useState } from 'react';

const NOTIFICATIONS = [
  { key: 'activation', label: 'New program activation', default: true },
  { key: 'comments', label: 'Community comments', default: true },
  { key: 'payout', label: 'Payout completed', default: true },
  { key: 'weekly', label: 'Weekly summary email', default: false },
];

export function NotificationToggles() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATIONS.map((n) => [n.key, n.default]))
  );

  function toggle(key: string) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-0">
      {NOTIFICATIONS.map((n) => (
        <div key={n.key} className="flex items-center justify-between py-4 border-b border-[#2a2a3a] last:border-b-0">
          <span className="text-sm text-white">{n.label}</span>
          <button
            onClick={() => toggle(n.key)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              toggles[n.key] ? 'bg-[#6c5ce7]' : 'bg-[#2a2a3a]'
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                toggles[n.key] ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

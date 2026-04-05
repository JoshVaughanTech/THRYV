'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const GOALS = ['Build Muscle', 'Lose Fat', 'Improve Strength', 'Athletic Performance', 'General Fitness'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

export function ProgramFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/programs?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <select
        value={searchParams.get('goal') || ''}
        onChange={(e) => updateFilter('goal', e.target.value)}
        className="rounded-lg border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 cursor-pointer"
      >
        <option value="">All Goals</option>
        {GOALS.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <select
        value={searchParams.get('level') || ''}
        onChange={(e) => updateFilter('level', e.target.value)}
        className="rounded-lg border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 cursor-pointer"
      >
        <option value="">All Levels</option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Search programs..."
        defaultValue={searchParams.get('q') || ''}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateFilter('q', (e.target as HTMLInputElement).value);
          }
        }}
        className="rounded-lg border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 min-w-[200px]"
      />
    </div>
  );
}

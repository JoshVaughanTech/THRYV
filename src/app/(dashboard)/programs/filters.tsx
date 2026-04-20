'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';

const GOALS = ['Build Muscle', 'Lose Fat', 'Improve Strength', 'Athletic Performance', 'General Fitness'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'shortest', label: 'Duration (Short to Long)' },
];
const EQUIPMENT = ['Barbell', 'Dumbbells', 'Kettlebell', 'Bodyweight', 'Cables', 'Machines', 'Bands'];

export function ProgramFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/programs?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleSearchInput(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateFilter('q', value);
    }, 400);
  }

  function clearSearch() {
    if (searchRef.current) searchRef.current.value = '';
    updateFilter('q', '');
  }

  const activeGoal = searchParams.get('goal') || '';
  const activeLevel = searchParams.get('level') || '';
  const activeSort = searchParams.get('sort') || '';
  const activeEquipment = searchParams.get('equipment') || '';
  const activeQuery = searchParams.get('q') || '';

  const hasActiveFilters = activeGoal || activeLevel || activeEquipment || activeQuery;

  function clearAllFilters() {
    router.push('/programs');
    if (searchRef.current) searchRef.current.value = '';
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search programs by name..."
          defaultValue={activeQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              updateFilter('q', (e.target as HTMLInputElement).value);
            }
          }}
          className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] pl-10 pr-10 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#00E5CC]/50 focus:border-[#00E5CC] transition-colors"
        />
        {activeQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={activeGoal}
          onChange={(e) => updateFilter('goal', e.target.value)}
          className="rounded-lg border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-[#00E5CC]/50 cursor-pointer appearance-none pr-8"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="">All Goals</option>
          {GOALS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={activeLevel}
          onChange={(e) => updateFilter('level', e.target.value)}
          className="rounded-lg border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-[#00E5CC]/50 cursor-pointer appearance-none pr-8"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="">All Levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <select
          value={activeSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="rounded-lg border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-[#00E5CC]/50 cursor-pointer appearance-none pr-8"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="rounded-lg border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:border-[#00E5CC]/50 transition-colors flex items-center gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Equipment filter pills */}
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT.map((eq) => {
          const isActive = activeEquipment === eq;
          return (
            <button
              key={eq}
              onClick={() => updateFilter('equipment', isActive ? '' : eq)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-[#00E5CC]/20 text-[#00E5CC] border-[#00E5CC]/40'
                  : 'bg-[#15151f] text-text-muted border-[#2a2a3a] hover:border-[#00E5CC]/30 hover:text-text-secondary'
              }`}
            >
              {eq}
            </button>
          );
        })}
      </div>
    </div>
  );
}

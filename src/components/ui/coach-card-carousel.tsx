'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Users, Dumbbell, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Coach {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  specialties: string[];
  follower_count: number;
  program_count: number;
  session_count: number;
  tier: 'PRO' | 'ELITE';
}

interface CoachCardCarouselProps {
  coaches: Coach[];
}

function CoachCard({ coach }: { coach: Coach }) {
  return (
    <div className="flex-shrink-0 w-[280px] rounded-2xl border border-[#1E1E1E] bg-[#141414] p-5 snap-start">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30 flex items-center justify-center text-xl font-bold text-accent-primary flex-shrink-0 overflow-hidden">
          {coach.avatar_url ? (
            <img src={coach.avatar_url} alt={coach.full_name} className="w-full h-full object-cover" />
          ) : (
            coach.full_name?.charAt(0) || '?'
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-text-primary text-sm truncate">{coach.full_name}</h3>
          <Badge
            variant={coach.tier === 'ELITE' ? 'warning' : 'accent'}
            className="mt-1 text-[10px] tracking-[1px] uppercase"
          >
            {coach.tier}
          </Badge>
        </div>
      </div>

      {/* Specialty */}
      {coach.specialties && coach.specialties.length > 0 && (
        <p className="text-xs text-text-secondary mb-4 line-clamp-1">
          {coach.specialties.join(' / ')}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 border-t border-[#1E1E1E] pt-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <p className="text-sm font-bold text-text-primary">{formatCount(coach.follower_count)}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-[1px]">Followers</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Dumbbell className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <p className="text-sm font-bold text-text-primary">{coach.program_count}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-[1px]">Programs</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <p className="text-sm font-bold text-text-primary">{formatCount(coach.session_count)}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-[1px]">Sessions</p>
        </div>
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function CoachCardCarousel({ coaches }: CoachCardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }

  if (!coaches || coaches.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Top Coaches</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full border border-[#2A2A2A] flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-muted transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full border border-[#2A2A2A] flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {coaches.map((coach) => (
          <CoachCard key={coach.id} coach={coach} />
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CompleteWorkoutButtonProps {
  workoutId: string;
  programId: string;
  creatorId: string;
  isCompleted: boolean;
  exerciseCount: number;
  momentumReward: number;
}

export function CompleteWorkoutButton({
  workoutId,
  programId,
  creatorId,
  isCompleted,
  exerciseCount,
  momentumReward,
}: CompleteWorkoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allDone = checkedCount >= exerciseCount;

  function startTimer() {
    setStarted(true);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }

  async function handleComplete() {
    setLoading(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('workout_sessions').insert({
      user_id: user.id,
      workout_id: workoutId,
      program_id: programId,
      duration_seconds: elapsed > 0 ? elapsed : null,
    });

    await supabase.from('momentum_events').insert({
      user_id: user.id,
      event_type: 'workout_completion',
      points: momentumReward,
      reference_id: workoutId,
    });

    await supabase.from('usage_events').insert([
      {
        user_id: user.id,
        program_id: programId,
        creator_id: creatorId,
        event_type: 'workout_completion',
        value: 1,
      },
      ...(elapsed > 0
        ? [{
            user_id: user.id,
            program_id: programId,
            creator_id: creatorId,
            event_type: 'time_spent' as const,
            value: elapsed,
          }]
        : []),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (streak) {
      const lastDate = streak.last_workout_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = streak.current_streak;
      if (lastDate === yesterday) newStreak += 1;
      else if (lastDate !== today) newStreak = 1;
      const longestStreak = Math.max(newStreak, streak.longest_streak);

      await supabase.from('streaks').update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_workout_date: today,
      }).eq('user_id', user.id);

      if (newStreak > 0 && newStreak % 7 === 0) {
        await supabase.from('momentum_events').insert({
          user_id: user.id,
          event_type: 'streak_bonus',
          points: 25,
        });
      }
    }

    router.refresh();
  }

  if (isCompleted) {
    return (
      <div className="bg-[#00E5CC] rounded-[14px] py-[15px] text-center">
        <div className="flex items-center justify-center gap-2">
          <Check className="h-5 w-5 text-white" strokeWidth={3} />
          <span className="text-white text-[14px] font-bold tracking-[0.5px]">
            COMPLETE  +{momentumReward}
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={started ? handleComplete : startTimer}
      disabled={loading}
      className="w-full py-[15px] rounded-[14px] text-[14px] font-bold tracking-[0.5px] transition-all cursor-pointer disabled:opacity-50"
      style={{
        background: allDone || started ? '#00E5CC' : '#2a2a3a',
        color: allDone || started ? '#ffffff' : '#666666',
      }}
    >
      {loading
        ? 'Saving...'
        : started
          ? `COMPLETE WORKOUT  +${momentumReward}`
          : 'START WORKOUT'
      }
    </button>
  );
}

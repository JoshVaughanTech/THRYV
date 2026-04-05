'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface CompleteWorkoutButtonProps {
  workoutId: string;
  programId: string;
  creatorId: string;
  isCompleted: boolean;
}

export function CompleteWorkoutButton({
  workoutId,
  programId,
  creatorId,
  isCompleted,
}: CompleteWorkoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function startTimer() {
    setStarted(true);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async function handleComplete() {
    setLoading(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Log workout session
    await supabase.from('workout_sessions').insert({
      user_id: user.id,
      workout_id: workoutId,
      program_id: programId,
      duration_seconds: elapsed > 0 ? elapsed : null,
    });

    // Award momentum points
    await supabase.from('momentum_events').insert({
      user_id: user.id,
      event_type: 'workout_completion',
      points: 10,
      reference_id: workoutId,
    });

    // Log usage events
    await supabase.from('usage_events').insert([
      {
        user_id: user.id,
        program_id: programId,
        creator_id: creatorId,
        event_type: 'workout_completion',
        value: 1,
      },
      ...(elapsed > 0
        ? [
            {
              user_id: user.id,
              program_id: programId,
              creator_id: creatorId,
              event_type: 'time_spent' as const,
              value: elapsed,
            },
          ]
        : []),
    ]);

    // Update streak
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
      if (lastDate === yesterday) {
        newStreak += 1;
      } else if (lastDate !== today) {
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, streak.longest_streak);

      await supabase
        .from('streaks')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_workout_date: today,
        })
        .eq('user_id', user.id);

      // Streak bonus momentum
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
      <Card className="text-center py-6 border-success/20 bg-success/5">
        <Check className="h-8 w-8 text-success mx-auto mb-2" />
        <p className="font-semibold text-success">Workout Complete!</p>
        <p className="text-sm text-text-muted mt-1">+10 Momentum earned</p>
      </Card>
    );
  }

  if (!started) {
    return (
      <div className="space-y-3">
        <Button onClick={startTimer} size="lg" className="w-full gap-2">
          <Timer className="h-5 w-5" />
          Start Workout
        </Button>
        <Button onClick={handleComplete} variant="secondary" size="lg" className="w-full gap-2">
          <Check className="h-5 w-5" />
          Mark Complete (no timer)
        </Button>
      </div>
    );
  }

  return (
    <Card glow className="text-center py-8">
      <Timer className="h-8 w-8 text-accent-primary mx-auto mb-3" />
      <p className="text-3xl font-bold text-text-primary font-mono mb-4">
        {formatTime(elapsed)}
      </p>
      <Button onClick={handleComplete} loading={loading} size="lg" className="gap-2">
        <Check className="h-5 w-5" />
        Complete Workout
      </Button>
    </Card>
  );
}

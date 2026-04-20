'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  Play,
  Timer,
  X,
  Share2,
  Star,
  Zap,
  Flame,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

/* ── Types ── */
type SetData = { weight: string; reps: string; rpe: string; done: boolean };
type ExerciseState = { expanded: boolean; sets: SetData[]; activeSet: number; completed: boolean };

interface WorkoutTrackerProps {
  workoutId: string;
  programId: string;
  creatorId: string;
  workoutTitle: string;
  programTitle: string;
  creatorName: string;
  weekNumber?: number;
  dayNumber?: number;
  exercises: {
    id: string;
    name: string;
    sets: number | null;
    reps: string | null;
    rest_seconds: number | null;
    rpe: number | null;
    notes: string | null;
    video_url: string | null;
  }[];
  isCompleted: boolean;
  momentumReward: number;
}

/* ── Rest Timer ── */
function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const total = useRef(seconds);

  useEffect(() => {
    if (remaining <= 0) { onClose(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onClose]);

  const pct = ((total.current - remaining) / total.current) * 100;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <div className="fixed bottom-20 left-5 right-5 lg:bottom-8 lg:left-auto lg:right-8 lg:w-[400px] z-[60] rounded-2xl border border-[#2a2a3a] bg-[#12121a] p-5 shadow-2xl">
      <p className="text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-medium text-center mb-2">Rest Timer</p>
      <p className="text-4xl font-bold text-[#00E5CC] text-center mb-3">
        {m}:{s.toString().padStart(2, '0')}
      </p>
      <div className="h-1 rounded-full bg-[#2a2a3a] mb-4 overflow-hidden">
        <div className="h-full rounded-full bg-[#00E5CC] transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setRemaining((r) => Math.max(0, r - 15))} className="flex-1 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-[11px] font-bold text-[#a0a0b8] cursor-pointer">-15s</button>
        <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-[11px] font-bold text-[#a0a0b8] cursor-pointer">Skip</button>
        <button onClick={() => { total.current += 15; setRemaining((r) => r + 15); }} className="flex-1 py-2 rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] text-[11px] font-bold text-[#a0a0b8] cursor-pointer">+15s</button>
      </div>
    </div>
  );
}

/* ── Session Summary ── */
function SessionSummary({
  exercises,
  exerciseStates,
  elapsed,
  momentumReward,
  programTitle,
  creatorName,
  streak,
  onFinish,
}: {
  exercises: WorkoutTrackerProps['exercises'];
  exerciseStates: ExerciseState[];
  elapsed: number;
  momentumReward: number;
  programTitle: string;
  creatorName: string;
  streak: number;
  onFinish: () => void;
}) {
  const totalSets = exerciseStates.reduce((s, e) => s + e.sets.filter((st) => st.done).length, 0);
  const totalVolume = exerciseStates.reduce((s, e) =>
    s + e.sets.filter((st) => st.done).reduce((v, st) => v + (parseFloat(st.weight) || 0) * (parseInt(st.reps) || 0), 0), 0);
  const rpeValues = exerciseStates.flatMap((e) => e.sets.filter((st) => st.done && st.rpe).map((st) => parseFloat(st.rpe)));
  const avgRpe = rpeValues.length > 0 ? (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1) : '—';
  const mins = Math.floor(elapsed / 60);

  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      {/* Success */}
      <div className="text-center mb-8">
        <div className="w-[72px] h-[72px] rounded-full bg-[#00E5CC]/10 flex items-center justify-center mx-auto mb-4">
          <Star className="h-8 w-8 text-[#00E5CC]" />
        </div>
        <h2 className="text-lg font-bold text-[#00E5CC] mb-1">Workout complete</h2>
        <p className="text-xs text-[#a0a0b8]">{programTitle} · {creatorName}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#00E5CC]/10 border border-[#00E5CC]/20 px-3 py-1 text-xs font-semibold text-[#00E5CC]">
            <Zap className="h-3 w-3" /> +{momentumReward}
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ffab00]/10 border border-[#ffab00]/25 px-3 py-1 text-xs font-semibold text-[#ffab00]">
              <Flame className="h-3 w-3" /> {streak} day streak
            </span>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { value: String(mins), label: 'Minutes', color: '#f0f0f5' },
          { value: totalVolume.toLocaleString(), label: 'Volume (lb)', color: '#f0f0f5' },
          { value: String(totalSets), label: 'Total Sets', color: '#f0f0f5' },
          { value: avgRpe, label: 'Avg RPE', color: '#ffab00' },
        ].map((s) => (
          <div key={s.label} className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-3 text-center">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] text-[#6b6b80] uppercase tracking-[0.5px]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Exercise Breakdown */}
      <p className="text-[10px] text-[#6b6b80] uppercase tracking-[1px] font-medium mb-3">Exercise Breakdown</p>
      <div className="rounded-2xl border border-[#2a2a3a] bg-[#12121a] overflow-hidden mb-8">
        {exercises.map((ex, i) => {
          const state = exerciseStates[i];
          const doneSets = state.sets.filter((s) => s.done);
          const bestWeight = Math.max(0, ...doneSets.map((s) => parseFloat(s.weight) || 0));
          const bestReps = doneSets.find((s) => parseFloat(s.weight) === bestWeight)?.reps || '—';

          return (
            <div key={ex.id} className={`flex items-center justify-between px-4 py-3 ${i < exercises.length - 1 ? 'border-b border-[#2a2a3a]' : ''}`}>
              <span className="text-xs font-semibold text-[#f0f0f5] flex-1">{ex.name}</span>
              <span className="text-[11px] text-[#a0a0b8] mr-3">{doneSets.length} × {bestReps}</span>
              <span className="text-[11px] font-bold text-[#f0f0f5] mr-3">{bestWeight > 0 ? `${bestWeight}lb` : '—'}</span>
              {rpeValues.length > 0 && (
                <span className="text-[11px] text-[#ffab00]">RPE {doneSets[0]?.rpe || '—'}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#2a2a3a] bg-[#12121a] text-xs font-semibold text-[#a0a0b8] cursor-pointer">
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
        <button onClick={onFinish} className="flex-[2] py-3.5 rounded-xl bg-[#00E5CC] text-sm font-bold text-white cursor-pointer">
          Finish Session
        </button>
      </div>
    </div>
  );
}

/* ── Main Tracker ── */
export function WorkoutTracker({
  workoutId, programId, creatorId, workoutTitle, programTitle, creatorName,
  weekNumber, dayNumber, exercises, isCompleted, momentumReward,
}: WorkoutTrackerProps) {
  const router = useRouter();
  const supabase = createClient();

  // Timer
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Rest timer
  const [restTimer, setRestTimer] = useState<number | null>(null);

  // Completion
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);

  // Exercise states
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(
    exercises.map((ex) => ({
      expanded: false,
      activeSet: 0,
      completed: false,
      sets: Array.from({ length: ex.sets || 3 }, () => ({
        weight: '', reps: '', rpe: '', done: false,
      })),
    }))
  );

  useEffect(() => {
    if (started) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started]);

  const completedExercises = exerciseStates.filter((e) => e.completed).length;
  const allDone = completedExercises === exercises.length;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  function toggleExpand(idx: number) {
    setExerciseStates((prev) => prev.map((e, i) => i === idx ? { ...e, expanded: !e.expanded } : e));
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof SetData, value: string | boolean) {
    setExerciseStates((prev) => prev.map((e, i) => {
      if (i !== exIdx) return e;
      const newSets = e.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s);
      const allSetsDone = newSets.every((s) => s.done);
      return { ...e, sets: newSets, completed: allSetsDone, activeSet: allSetsDone ? e.activeSet : setIdx + 1 };
    }));
  }

  function addSet(exIdx: number) {
    setExerciseStates((prev) => prev.map((e, i) =>
      i === exIdx ? { ...e, sets: [...e.sets, { weight: '', reps: '', rpe: '', done: false }] } : e
    ));
  }

  async function handleComplete() {
    setSaving(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert workout session and return its ID directly (no race condition)
    const { data: newSession, error: sessionError } = await supabase.from('workout_sessions').insert({
      user_id: user.id, workout_id: workoutId, program_id: programId,
      duration_seconds: elapsed > 0 ? elapsed : null,
    }).select('id').single();

    if (sessionError || !newSession) {
      setSaving(false);
      return;
    }

    const sessionId = newSession.id;

    await supabase.from('momentum_events').insert({
      user_id: user.id, event_type: 'workout_completion', points: momentumReward, reference_id: workoutId,
    });

    await supabase.from('usage_events').insert([
      { user_id: user.id, program_id: programId, creator_id: creatorId, event_type: 'workout_completion', value: 1 },
      ...(elapsed > 0 ? [{ user_id: user.id, program_id: programId, creator_id: creatorId, event_type: 'time_spent' as const, value: elapsed }] : []),
    ]);

    // Update streak (initialize if missing)
    const today = new Date().toISOString().split('T')[0];
    const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', user.id).single();
    let newStreak = 1;
    if (streakData) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      newStreak = streakData.current_streak;
      if (streakData.last_workout_date === yesterday) newStreak += 1;
      else if (streakData.last_workout_date !== today) newStreak = 1;
      await supabase.from('streaks').update({
        current_streak: newStreak, longest_streak: Math.max(newStreak, streakData.longest_streak), last_workout_date: today,
      }).eq('user_id', user.id);
    } else {
      // First workout ever — create streak record
      await supabase.from('streaks').insert({
        user_id: user.id, current_streak: 1, longest_streak: 1, last_workout_date: today,
      });
    }
    setStreak(newStreak);

    // ── Save set logs ──
    if (sessionId) {
      const setLogRows: {
        session_id: string;
        exercise_id: string;
        set_number: number;
        weight: number | null;
        reps: number | null;
        rpe: number | null;
        completed: boolean;
      }[] = [];

      exercises.forEach((ex, exIdx) => {
        const state = exerciseStates[exIdx];
        state.sets.forEach((set, setIdx) => {
          setLogRows.push({
            session_id: sessionId,
            exercise_id: ex.id,
            set_number: setIdx + 1,
            weight: set.weight ? parseFloat(set.weight) : null,
            reps: set.reps ? parseInt(set.reps, 10) : null,
            rpe: set.rpe ? parseFloat(set.rpe) : null,
            completed: set.done,
          });
        });
      });

      if (setLogRows.length > 0) {
        const { error: logsError } = await supabase.from('set_logs').insert(setLogRows);
        if (logsError) console.error('Set logs insert failed:', logsError);
      }

      // ── Check for new PRs ──
      const newPRs: string[] = [];

      for (let exIdx = 0; exIdx < exercises.length; exIdx++) {
        const ex = exercises[exIdx];
        const state = exerciseStates[exIdx];
        const doneSets = state.sets.filter((s) => s.done && s.weight && s.reps);

        if (doneSets.length === 0) continue;

        // Find the best set by estimated 1RM (Epley formula: weight * (1 + reps / 30))
        let bestWeight = 0;
        let bestReps = 0;
        let bestE1rm = 0;

        for (const set of doneSets) {
          const w = parseFloat(set.weight) || 0;
          const r = parseInt(set.reps, 10) || 0;
          if (w <= 0 || r <= 0) continue;
          const e1rm = r === 1 ? w : w * (1 + r / 30);
          if (e1rm > bestE1rm) {
            bestE1rm = e1rm;
            bestWeight = w;
            bestReps = r;
          }
        }

        if (bestE1rm <= 0) continue;

        // Check existing PR for this exercise_name
        const { data: existingPR } = await supabase
          .from('personal_records')
          .select('id, estimated_1rm')
          .eq('user_id', user.id)
          .eq('exercise_name', ex.name)
          .order('estimated_1rm', { ascending: false })
          .limit(1)
          .single();

        const existingE1rm = existingPR ? Number(existingPR.estimated_1rm) || 0 : 0;

        if (bestE1rm > existingE1rm) {
          await supabase.from('personal_records').insert({
            user_id: user.id,
            exercise_name: ex.name,
            weight: bestWeight,
            reps: bestReps,
            estimated_1rm: Math.round(bestE1rm * 10) / 10,
            achieved_at: new Date().toISOString(),
            session_id: sessionId,
          });
          newPRs.push(ex.name);
        }
      }

      // ── Create notifications ──
      const notifications: {
        user_id: string;
        type: string;
        title: string;
        body: string | null;
        data: Record<string, unknown>;
      }[] = [];

      // Workout completion notification
      notifications.push({
        user_id: user.id,
        type: 'workout_complete',
        title: 'Workout Complete!',
        body: `You finished ${workoutTitle} from ${programTitle}.`,
        data: { workout_id: workoutId, session_id: sessionId },
      });

      // PR notifications
      for (const prName of newPRs) {
        notifications.push({
          user_id: user.id,
          type: 'workout_complete',
          title: `New PR: ${prName}`,
          body: `You set a new personal record on ${prName}!`,
          data: { exercise_name: prName, session_id: sessionId },
        });
      }

      // Streak milestone notification (every 7 days)
      if (newStreak > 0 && newStreak % 7 === 0) {
        notifications.push({
          user_id: user.id,
          type: 'streak_milestone',
          title: `${newStreak}-Day Streak!`,
          body: `You've worked out ${newStreak} days in a row. Keep it up!`,
          data: { streak: newStreak },
        });
      }

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      // ── Week advancement / Program completion ──
      if (programId && weekNumber) {
        // Get current program activation
        const { data: activation } = await supabase
          .from('program_activations')
          .select('id, current_week, program_id, programs(title, duration_weeks)')
          .eq('user_id', user.id)
          .eq('program_id', programId)
          .eq('is_active', true)
          .single();

        if (activation) {
          // Get the current week record to find all workouts in this week
          const { data: currentWeek } = await supabase
            .from('program_weeks')
            .select('id, workouts(id)')
            .eq('program_id', programId)
            .eq('week_number', weekNumber)
            .single();

          if (currentWeek?.workouts) {
            const weekWorkoutIds = currentWeek.workouts.map((w: any) => w.id);

            // Count completed sessions for workouts in this week, scoped to this activation
            const { count: completedCount } = await supabase
              .from('workout_sessions')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .in('workout_id', weekWorkoutIds)
              .gte('completed_at', (activation as any).activated_at || '1970-01-01');

            const allWeekWorkoutsDone = (completedCount || 0) >= weekWorkoutIds.length;

            if (allWeekWorkoutsDone) {
              // Check if a next week exists
              const { data: nextWeek } = await supabase
                .from('program_weeks')
                .select('id, week_number')
                .eq('program_id', programId)
                .eq('week_number', weekNumber + 1)
                .single();

              if (nextWeek) {
                // Advance to next week
                const { error: advanceError } = await supabase
                  .from('program_activations')
                  .update({ current_week: weekNumber + 1 })
                  .eq('id', activation.id);

                if (!advanceError) {
                  await supabase.from('notifications').insert({
                    user_id: user.id,
                    type: 'level_up',
                    title: `Week ${weekNumber} complete!`,
                    body: `Moving to Week ${weekNumber + 1}. Keep pushing!`,
                    data: { program_id: programId, from_week: weekNumber, to_week: weekNumber + 1 },
                  });
                }
              } else {
                // No more weeks — program complete
                const progTitle = (activation as any).programs?.title || programTitle;

                await supabase
                  .from('program_activations')
                  .update({ is_active: false, completed_at: new Date().toISOString() })
                  .eq('id', activation.id);

                await supabase.from('momentum_events').insert({
                  user_id: user.id,
                  event_type: 'program_completion',
                  points: 50,
                  reference_id: programId,
                });

                await supabase.from('notifications').insert({
                  user_id: user.id,
                  type: 'level_up',
                  title: 'Program Complete!',
                  body: `You completed ${progTitle}! +50 Momentum earned.`,
                  data: { program_id: programId, completed: true },
                });
              }
            }
          }
        }
      }
    }

    setSaving(false);
    setShowSummary(true);
  }

  if (isCompleted) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-[#00E5CC] flex items-center justify-center mx-auto mb-4">
          <Check className="h-7 w-7 text-white" strokeWidth={3} />
        </div>
        <p className="text-lg font-bold text-[#00E5CC] mb-1">Workout Complete!</p>
        <p className="text-sm text-[#6b6b80]">+{momentumReward} Momentum earned</p>
        <Link href="/my-programs" className="inline-block mt-6 text-sm text-[#00E5CC] hover:text-[#00CCBB]">
          ← Back to My Programs
        </Link>
      </div>
    );
  }

  if (showSummary) {
    return (
      <SessionSummary
        exercises={exercises}
        exerciseStates={exerciseStates}
        elapsed={elapsed}
        momentumReward={momentumReward}
        programTitle={programTitle}
        creatorName={creatorName}
        streak={streak}
        onFinish={() => { router.push('/my-programs'); router.refresh(); }}
      />
    );
  }

  const creatorInitials = creatorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl lg:mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-3">
          <Link href="/my-programs" className="p-1"><ArrowLeft className="h-5 w-5 text-white" /></Link>
          <div>
            <p className="text-white font-bold text-[16px]">{workoutTitle}</p>
            <p className="text-[10px] text-[#6b6b80]">{programTitle} · Week {weekNumber || '—'} · Day {dayNumber || '—'}</p>
          </div>
        </div>
        {started && (
          <div className="flex items-center gap-2 rounded-[10px] border border-[#2a2a3a] bg-[#12121a] px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff5252] animate-pulse" />
            <span className="text-xs font-bold text-white font-mono">{formatTime(elapsed)}</span>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex gap-2 mt-4 mb-5">
        {[
          { label: 'Exercises', value: `${completedExercises} / ${exercises.length}`, color: '#00E5CC' },
          { label: 'Volume (lb)', value: exerciseStates.reduce((s, e) => s + e.sets.filter((st) => st.done).reduce((v, st) => v + (parseFloat(st.weight) || 0) * (parseInt(st.reps) || 0), 0), 0).toLocaleString(), color: '#f0f0f5' },
          { label: 'Avg RPE', value: (() => { const v = exerciseStates.flatMap((e) => e.sets.filter((s) => s.done && s.rpe).map((s) => parseFloat(s.rpe))); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '—'; })(), color: '#ffab00' },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-[#12121a] border border-[#2a2a3a] rounded-[10px] py-2 text-center">
            <p className="text-xs font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[8px] text-[#6b6b80] uppercase tracking-[0.5px]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Exercise Cards */}
      <div className="space-y-2">
        {exercises.map((ex, exIdx) => {
          const state = exerciseStates[exIdx];
          return (
            <div key={ex.id} className={`rounded-2xl border bg-[#12121a] transition-all ${
              state.completed ? 'border-[#2a2a3a] opacity-50' : state.expanded ? 'border-[#00E5CC]/30' : 'border-[#2a2a3a]'
            }`}>
              {/* Collapsed header */}
              <button onClick={() => toggleExpand(exIdx)} className="w-full flex items-center gap-3 p-4 cursor-pointer text-left">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-extrabold flex-shrink-0 ${
                  state.completed ? 'bg-[#00E5CC]' : 'bg-[#1a1a2e]'
                }`}>
                  {state.completed ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : <span className="text-[#7799dd]">{exIdx + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold ${state.completed ? 'text-[#6b6b80]' : 'text-white'}`}>{ex.name}</p>
                  <p className="text-[10px] text-[#6b6b80]">
                    {state.completed
                      ? `${state.sets.filter((s) => s.done).length} sets · Best: ${Math.max(0, ...state.sets.map((s) => parseFloat(s.weight) || 0))}lb`
                      : `${ex.sets || 3} sets × ${ex.reps || '?'} reps${ex.rest_seconds ? ` · Rest: ${ex.rest_seconds}s` : ''}${ex.rpe ? ` · RPE ${ex.rpe}` : ''}`
                    }
                  </p>
                </div>
                {state.expanded ? <ChevronDown className="h-4 w-4 text-[#6b6b80]" /> : <ChevronRight className="h-4 w-4 text-[#6b6b80]" />}
              </button>

              {/* Expanded content */}
              {state.expanded && !state.completed && (
                <div className="px-4 pb-4">
                  {/* Prescription */}
                  <div className="flex items-center gap-2 mb-3 text-[10px] text-[#6b6b80]">
                    <span>Rx: {ex.sets || 3} × {ex.reps || '?'}</span>
                    {ex.rest_seconds && <span>| Rest: {ex.rest_seconds}s</span>}
                    {ex.rpe && <span>| Target RPE: {ex.rpe}</span>}
                    {ex.video_url && (
                      <a href={ex.video_url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[#6b6b80] hover:text-[#00E5CC]">
                        <Play className="h-3 w-3" /> <span className="text-[9px] font-semibold">VIDEO</span>
                      </a>
                    )}
                  </div>

                  {/* Column headers */}
                  <div className="flex items-center gap-1 mb-1 px-1">
                    <span className="w-8 text-[9px] text-[#6b6b80] font-medium">SET</span>
                    <span className="w-12 text-[9px] text-[#6b6b80] font-medium">PREV</span>
                    <span className="flex-1 text-[9px] text-[#6b6b80] font-medium">WEIGHT</span>
                    <span className="w-12 text-[9px] text-[#ffab00] font-medium">REPS</span>
                    <span className="w-10 text-[9px] text-[#b477d9] font-medium">RPE</span>
                    <span className="w-6" />
                  </div>

                  {/* Set rows */}
                  {state.sets.map((set, setIdx) => (
                    <div key={setIdx} className={`flex items-center gap-1 py-1.5 px-1 rounded-lg ${
                      setIdx === state.activeSet && !set.done ? 'bg-[#00E5CC]/[0.03]' : ''
                    }`}>
                      <span className="w-8 text-[12px] font-bold text-[#00E5CC]">{setIdx + 1}</span>
                      <span className="w-12 text-[10px] text-[#4a4a5a]">—</span>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        placeholder="0"
                        className={`flex-1 bg-[#0a0a0f] rounded-lg border px-2 py-1.5 text-sm font-bold text-center focus:outline-none ${
                          set.done ? 'border-[#2a2a3a] text-[#6b6b80]' : 'border-[#2a2a3a] text-white focus:border-[#00E5CC]'
                        }`}
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        placeholder={ex.reps || '0'}
                        className="w-12 bg-[#0a0a0f] rounded-lg border border-[#2a2a3a] px-1 py-1.5 text-sm font-bold text-center text-[#ffab00] focus:outline-none focus:border-[#00E5CC]"
                      />
                      <input
                        value={set.rpe}
                        onChange={(e) => updateSet(exIdx, setIdx, 'rpe', e.target.value)}
                        placeholder="—"
                        className="w-10 bg-[#0a0a0f] rounded-lg border border-[#2a2a3a] px-1 py-1.5 text-sm font-bold text-center text-[#b477d9] focus:outline-none focus:border-[#00E5CC]"
                      />
                      <button
                        onClick={() => updateSet(exIdx, setIdx, 'done', !set.done)}
                        className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 cursor-pointer ${
                          set.done ? 'bg-[#00E5CC] border-[#00E5CC]' : 'border-[#2a2a3a]'
                        }`}
                      >
                        {set.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </button>
                    </div>
                  ))}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => addSet(exIdx)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-[#2a2a3a] text-[10px] font-semibold text-[#6b6b80] hover:text-[#a0a0b8] cursor-pointer">
                      <Plus className="h-3 w-3" /> Add set
                    </button>
                    {ex.rest_seconds && (
                      <button onClick={() => setRestTimer(ex.rest_seconds!)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-[#00E5CC]/10 text-[10px] font-bold text-[#00E5CC] cursor-pointer">
                        <Timer className="h-3 w-3" /> Rest {ex.rest_seconds}s
                      </button>
                    )}
                  </div>

                  {/* Notes */}
                  {ex.notes && (
                    <p className="mt-3 text-[11px] text-[#6b6b80] italic bg-[#0c0c14] rounded-lg px-3 py-2">{ex.notes}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rest Timer Modal */}
      {restTimer !== null && <RestTimer seconds={restTimer} onClose={() => setRestTimer(null)} />}

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:relative lg:mt-6 z-30">
        <div className="bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent px-5 pt-4 pb-9 lg:p-0 lg:bg-none flex gap-3">
          {!started ? (
            <button onClick={() => setStarted(true)} className="flex-1 py-4 rounded-xl bg-[#00E5CC] text-sm font-bold text-white cursor-pointer">
              START WORKOUT
            </button>
          ) : (
            <>
              <button
                onClick={handleComplete}
                disabled={saving || !allDone}
                className={`flex-[2] py-4 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                  allDone ? 'bg-[#00E5CC] text-white' : 'bg-[#1a1a25] border border-[#2a2a3a] text-[#6b6b80]'
                } disabled:opacity-50`}
              >
                {saving ? 'SAVING...' : allDone ? 'COMPLETE WORKOUT' : `${completedExercises} OF ${exercises.length} EXERCISES DONE`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

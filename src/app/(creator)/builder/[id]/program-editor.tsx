'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Eye,
  EyeOff,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Dumbbell,
  Settings,
  Clock,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { uploadProgramCover } from '@/lib/upload';
import Link from 'next/link';

const GOALS = ['Build Muscle', 'Lose Fat', 'Improve Strength', 'Athletic Performance', 'General Fitness'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const DISCIPLINES = ['Strength', 'Hypertrophy', 'HIIT', 'Endurance', 'Mobility', 'Sport-Specific'];
const EQUIPMENT = ['Full Gym', 'Home Gym', 'Dumbbells Only', 'Bodyweight Only', 'Kettlebells', 'Resistance Bands'];
const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ProgramEditorProps {
  program: any;
  weeks: any[];
}

export function ProgramEditor({ program, weeks: initialWeeks }: ProgramEditorProps) {
  const [title, setTitle] = useState(program.title);
  const [description, setDescription] = useState(program.description || '');
  const [goal, setGoal] = useState(program.goal || '');
  const [discipline, setDiscipline] = useState(program.discipline || '');
  const [experienceLevel, setExperienceLevel] = useState(program.experience_level || '');
  const [creditCost, setCreditCost] = useState(program.credit_cost);
  const [coverImageUrl, setCoverImageUrl] = useState(program.cover_image_url || '');
  const [equipment, setEquipment] = useState<string[]>(program.equipment || []);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(
    new Set(initialWeeks.length > 0 ? [initialWeeks[0].id] : [])
  );

  const [confirmDelete, setConfirmDelete] = useState<{ type: 'week' | 'workout' | 'program'; id: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();
  const [draggedExercise, setDraggedExercise] = useState<string | null>(null);

  const selectedWeek = initialWeeks.find((w: any) => w.id === selectedWeekId);
  const selectedWorkout = selectedWeek?.workouts
    ?.sort((a: any, b: any) => a.order_index - b.order_index)
    ?.find((w: any) => w.id === selectedWorkoutId);

  const totalWorkouts = initialWeeks.reduce((sum: number, w: any) => sum + (w.workouts?.length || 0), 0);
  const totalExercises = initialWeeks.reduce((sum: number, w: any) =>
    sum + (w.workouts?.reduce((ws: number, wo: any) => ws + (wo.exercises?.length || 0), 0) || 0), 0);

  function toggleWeek(weekId: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  }

  function toggleEquipment(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('programs').update({
      title,
      description: description || null,
      goal: goal || null,
      discipline: discipline || null,
      experience_level: experienceLevel || null,
      credit_cost: creditCost,
      cover_image_url: coverImageUrl || null,
      equipment: equipment.length > 0 ? equipment : null,
    }).eq('id', program.id);
    setSaving(false);
    router.refresh();
  }

  async function handlePublish() {
    setPublishing(true);
    const newStatus = program.status === 'published' ? 'unpublished' : 'published';
    await supabase.from('programs').update({ status: newStatus }).eq('id', program.id);
    setPublishing(false);
    router.refresh();
  }

  async function addWeek() {
    const nextNumber = initialWeeks.length > 0
      ? Math.max(...initialWeeks.map((w: any) => w.week_number)) + 1
      : 1;
    const { data } = await supabase.from('program_weeks').insert({
      program_id: program.id,
      week_number: nextNumber,
      title: `Week ${nextNumber}`,
    }).select().single();

    await supabase.from('programs').update({
      duration_weeks: nextNumber,
    }).eq('id', program.id);

    if (data) {
      setExpandedWeeks((prev) => new Set([...prev, data.id]));
      setSelectedWeekId(data.id);
      setSelectedWorkoutId(null);
    }
    router.refresh();
  }

  async function deleteWeek(weekId: string) {
    await supabase.from('program_weeks').delete().eq('id', weekId);

    const remaining = initialWeeks.filter((w: any) => w.id !== weekId);
    await supabase.from('programs').update({
      duration_weeks: remaining.length,
    }).eq('id', program.id);

    if (selectedWeekId === weekId) {
      setSelectedWeekId(null);
      setSelectedWorkoutId(null);
    }
    setConfirmDelete(null);
    router.refresh();
  }

  async function duplicateWeek(weekId: string) {
    const week = initialWeeks.find((w: any) => w.id === weekId);
    if (!week) return;

    const nextNumber = Math.max(...initialWeeks.map((w: any) => w.week_number)) + 1;

    const { data: newWeek } = await supabase.from('program_weeks').insert({
      program_id: program.id,
      week_number: nextNumber,
      title: `Week ${nextNumber}`,
    }).select().single();

    if (newWeek && week.workouts) {
      for (const workout of week.workouts.sort((a: any, b: any) => a.order_index - b.order_index)) {
        const { data: newWorkout } = await supabase.from('workouts').insert({
          week_id: newWeek.id,
          program_id: program.id,
          title: workout.title,
          description: workout.description,
          day_of_week: workout.day_of_week,
          order_index: workout.order_index,
          estimated_duration: workout.estimated_duration,
        }).select().single();

        if (newWorkout && workout.exercises) {
          const exercises = workout.exercises
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((ex: any) => ({
              workout_id: newWorkout.id,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              notes: ex.notes,
              rest_seconds: ex.rest_seconds,
              rpe: ex.rpe,
              tempo: ex.tempo,
              order_index: ex.order_index,
            }));
          if (exercises.length > 0) {
            await supabase.from('exercises').insert(exercises);
          }
        }
      }
    }

    await supabase.from('programs').update({
      duration_weeks: nextNumber,
    }).eq('id', program.id);

    router.refresh();
  }

  async function addWorkout(weekId: string, programId: string) {
    const { data: existing } = await supabase.from('workouts').select('order_index')
      .eq('week_id', weekId).order('order_index', { ascending: false }).limit(1);
    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
    const { data } = await supabase.from('workouts').insert({
      week_id: weekId, program_id: programId, title: 'New Workout', order_index: nextOrder,
    }).select().single();
    if (data) {
      setSelectedWeekId(weekId);
      setSelectedWorkoutId(data.id);
    }
    router.refresh();
  }

  async function addExercise(workoutId: string) {
    const { data: existing } = await supabase.from('exercises').select('order_index')
      .eq('workout_id', workoutId).order('order_index', { ascending: false }).limit(1);
    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
    await supabase.from('exercises').insert({ workout_id: workoutId, name: 'New Exercise', order_index: nextOrder });
    router.refresh();
  }

  async function updateWorkout(workoutId: string, field: string, value: any) {
    await supabase.from('workouts').update({ [field]: value }).eq('id', workoutId);
  }

  async function updateExercise(exerciseId: string, field: string, value: any) {
    await supabase.from('exercises').update({ [field]: value }).eq('id', exerciseId);
  }

  async function deleteWorkout(workoutId: string) {
    await supabase.from('workouts').delete().eq('id', workoutId);
    if (selectedWorkoutId === workoutId) setSelectedWorkoutId(null);
    setConfirmDelete(null);
    router.refresh();
  }

  async function deleteExercise(exerciseId: string) {
    await supabase.from('exercises').delete().eq('id', exerciseId);
    router.refresh();
  }

  async function deleteProgram() {
    await supabase.from('programs').delete().eq('id', program.id);
    router.push('/builder');
  }

  async function handleExerciseDrop(exerciseId: string, targetIndex: number) {
    if (!selectedWorkout) return;
    const exercises = [...(selectedWorkout.exercises || [])].sort((a: any, b: any) => a.order_index - b.order_index);
    const moved = exercises.find((e: any) => e.id === exerciseId);
    if (!moved) return;
    const filtered = exercises.filter((e: any) => e.id !== exerciseId);
    filtered.splice(targetIndex, 0, moved);
    await Promise.all(filtered.map((e: any, i: number) =>
      supabase.from('exercises').update({ order_index: i }).eq('id', e.id)
    ));
    router.refresh();
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col -mx-8 -my-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#2a2a3a] bg-[#0a0a0f]">
        <div className="flex items-center gap-4">
          <Link href="/builder" className="inline-flex items-center gap-1.5 text-sm text-[#6b6b80] hover:text-[#a0a0b8] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-[#2a2a3a]" />
          <span className="text-sm text-[#a0a0b8] truncate max-w-[200px]">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={program.status === 'published' ? 'success' : program.status === 'draft' ? 'warning' : 'default'}>
            {program.status}
          </Badge>
          <Button variant="secondary" size="sm" onClick={handlePublish} loading={publishing} className="gap-1.5">
            {program.status === 'published' ? <><EyeOff className="h-4 w-4" /> Unpublish</> : <><Eye className="h-4 w-4" /> Publish</>}
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving} className="gap-1.5">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Delete {confirmDelete.type}?</h3>
                <p className="text-xs text-[#6b6b80]">
                  {confirmDelete.type === 'program'
                    ? 'This will permanently delete this program and all its content.'
                    : confirmDelete.type === 'week'
                    ? 'This will delete the week and all its workouts and exercises.'
                    : 'This will delete the workout and all its exercises.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (confirmDelete.type === 'week') deleteWeek(confirmDelete.id);
                  else if (confirmDelete.type === 'workout') deleteWorkout(confirmDelete.id);
                  else if (confirmDelete.type === 'program') deleteProgram();
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Program structure */}
        <div className="w-[340px] border-r border-[#2a2a3a] overflow-y-auto flex-shrink-0 bg-[#0a0a0f]">
          <div className="p-5">
            {/* Program info card */}
            <button
              onClick={() => { setSelectedWorkoutId(null); setSelectedWeekId(null); }}
              className={`w-full text-left rounded-xl border p-4 mb-5 transition-all cursor-pointer ${
                !selectedWorkoutId
                  ? 'border-[#00E5CC]/30 bg-[#00E5CC]/5'
                  : 'border-[#2a2a3a] bg-[#15151f] hover:border-[#3a3a4a]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-3.5 w-3.5 text-[#00E5CC]" />
                <span className="text-[10px] text-[#00E5CC] uppercase tracking-[1px] font-semibold">Program Settings</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{title}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#6b6b80]">
                <span>{initialWeeks.length} weeks</span>
                <span>{totalWorkouts} workouts</span>
                <span>{totalExercises} exercises</span>
              </div>
            </button>

            {/* Week tree */}
            <div className="space-y-1">
              {initialWeeks.map((week: any) => {
                const isExpanded = expandedWeeks.has(week.id);
                const isSelectedWeek = selectedWeekId === week.id;
                const workouts = week.workouts?.sort((a: any, b: any) => a.order_index - b.order_index) || [];

                return (
                  <div key={week.id}>
                    <div className="group flex items-center">
                      <button
                        onClick={() => { toggleWeek(week.id); setSelectedWeekId(week.id); }}
                        className={`flex items-center justify-between flex-1 rounded-xl px-4 py-3 text-sm transition-all cursor-pointer ${
                          isSelectedWeek && isExpanded
                            ? 'bg-[#00E5CC]/10 border border-[#00E5CC]/30'
                            : 'border border-transparent hover:bg-[#15151f]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5 text-[#a0a0b8]" />
                            : <ChevronRight className="h-3.5 w-3.5 text-[#a0a0b8]" />
                          }
                          <span className={`font-medium ${isSelectedWeek ? 'text-[#00E5CC]' : 'text-white'}`}>
                            Week {week.week_number}
                          </span>
                        </div>
                        <span className="text-xs text-[#6b6b80]">
                          {workouts.length} workout{workouts.length !== 1 ? 's' : ''}
                        </span>
                      </button>

                      {/* Week actions */}
                      <div className="hidden group-hover:flex items-center gap-0.5 mr-1">
                        <button
                          onClick={() => duplicateWeek(week.id)}
                          className="p-1.5 text-[#4a4a5a] hover:text-[#00E5CC] transition-colors cursor-pointer rounded-lg hover:bg-[#15151f]"
                          title="Duplicate week"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: 'week', id: week.id })}
                          className="p-1.5 text-[#4a4a5a] hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-[#15151f]"
                          title="Delete week"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {workouts.map((workout: any) => (
                          <button
                            key={workout.id}
                            onClick={() => { setSelectedWeekId(week.id); setSelectedWorkoutId(workout.id); }}
                            className={`flex items-center justify-between w-full rounded-lg px-4 py-2 text-[13px] transition-all cursor-pointer ${
                              selectedWorkoutId === workout.id
                                ? 'bg-[#00E5CC] text-white font-medium'
                                : 'text-[#a0a0b8] hover:bg-[#15151f] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                selectedWorkoutId === workout.id ? 'bg-[#0a0a0f]' : 'bg-[#00E5CC]'
                              }`} />
                              <span className="truncate">{workout.title}</span>
                            </div>
                            <span className={`text-[11px] ${selectedWorkoutId === workout.id ? 'text-white/60' : 'text-[#6b6b80]'}`}>
                              {workout.exercises?.length || 0} ex
                            </span>
                          </button>
                        ))}

                        <button
                          onClick={() => addWorkout(week.id, program.id)}
                          className="flex items-center gap-1.5 w-full px-4 py-2 text-[12px] text-[#6b6b80] hover:text-[#00E5CC] transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          Add workout
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add week */}
            <button
              onClick={addWeek}
              className="flex items-center justify-center gap-2 w-full mt-4 rounded-xl border border-dashed border-[#2a2a3a] py-3 text-xs text-[#6b6b80] hover:text-[#00E5CC] hover:border-[#00E5CC]/30 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add week
            </button>

            {/* Delete program */}
            <button
              onClick={() => setConfirmDelete({ type: 'program', id: program.id })}
              className="flex items-center justify-center gap-2 w-full mt-3 rounded-xl py-2.5 text-xs text-[#4a4a5a] hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              Delete program
            </button>
          </div>
        </div>

        {/* Panel 2: Content editor */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0f]">
          <div className="p-6 max-w-3xl">
            {selectedWorkout ? (
              /* ─── Workout / Exercise Editor ─── */
              <>
                {/* Breadcrumb */}
                <p className="text-xs text-[#6b6b80] mb-2">
                  Week {selectedWeek?.week_number} &middot; Workout {
                    (selectedWeek?.workouts?.sort((a: any, b: any) => a.order_index - b.order_index)
                      .findIndex((w: any) => w.id === selectedWorkoutId) ?? 0) + 1
                  } of {selectedWeek?.workouts?.length || 0}
                </p>

                {/* Workout header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Workout Name</label>
                      <input
                        defaultValue={selectedWorkout.title}
                        key={`title-${selectedWorkout.id}`}
                        onBlur={(e) => updateWorkout(selectedWorkout.id, 'title', e.target.value)}
                        className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-[#00E5CC]/50"
                      />
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Description</label>
                        <textarea
                          defaultValue={selectedWorkout.description || ''}
                          key={`desc-${selectedWorkout.id}`}
                          onBlur={(e) => updateWorkout(selectedWorkout.id, 'description', e.target.value || null)}
                          rows={2}
                          placeholder="Optional workout description..."
                          className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E5CC]/50 resize-none placeholder:text-[#4a4a5a]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div>
                        <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Day</label>
                        <select
                          defaultValue={selectedWorkout.day_of_week || ''}
                          key={`day-${selectedWorkout.id}`}
                          onChange={(e) => updateWorkout(selectedWorkout.id, 'day_of_week', e.target.value ? Number(e.target.value) : null)}
                          className="rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E5CC]/50 cursor-pointer"
                        >
                          {DAYS.map((d, i) => (
                            <option key={i} value={i || ''}>{d || 'Any day'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">
                          <Clock className="h-3 w-3 inline mr-1" />Est. Duration
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            defaultValue={selectedWorkout.estimated_duration || ''}
                            key={`dur-${selectedWorkout.id}`}
                            onBlur={(e) => updateWorkout(selectedWorkout.id, 'estimated_duration', e.target.value ? Number(e.target.value) : null)}
                            placeholder="45"
                            className="w-20 rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E5CC]/50 placeholder:text-[#4a4a5a]"
                          />
                          <span className="text-xs text-[#6b6b80]">min</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmDelete({ type: 'workout', id: selectedWorkout.id })}
                    className="ml-4 p-2 text-[#4a4a5a] hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-[#15151f]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Exercises */}
                <h3 className="text-base font-bold text-white mb-4">Exercises</h3>
                <div className="space-y-3">
                  {selectedWorkout.exercises
                    ?.sort((a: any, b: any) => a.order_index - b.order_index)
                    .map((exercise: any, index: number) => (
                      <div
                        key={exercise.id}
                        draggable
                        onDragStart={() => setDraggedExercise(exercise.id)}
                        onDragEnd={() => setDraggedExercise(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedExercise && draggedExercise !== exercise.id) {
                            handleExerciseDrop(draggedExercise, index);
                          }
                        }}
                        className={`flex items-start gap-3 rounded-xl border bg-[#15151f] p-4 transition-all ${
                          draggedExercise === exercise.id ? 'border-[#00E5CC]/50 opacity-50' : 'border-[#2a2a3a]'
                        }`}
                      >
                        <div className="cursor-grab active:cursor-grabbing pt-1 text-[#4a4a5a] hover:text-[#a0a0b8] transition-colors">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        <div className="w-8 h-8 rounded-lg bg-[#00E5CC] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            defaultValue={exercise.name}
                            key={`ex-name-${exercise.id}`}
                            onBlur={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                            className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-transparent focus:border-[#00E5CC]"
                          />
                          <div className="flex items-center gap-4">
                            <div>
                              <label className="block text-[10px] text-[#6b6b80] mb-0.5">Sets</label>
                              <input type="number" defaultValue={exercise.sets || ''}
                                key={`ex-sets-${exercise.id}`}
                                onBlur={(e) => updateExercise(exercise.id, 'sets', e.target.value ? Number(e.target.value) : null)}
                                className="w-12 bg-[#1f1f2e] rounded px-2 py-1 text-sm font-bold text-white text-center focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[#6b6b80] mb-0.5">Reps</label>
                              <input defaultValue={exercise.reps || ''}
                                key={`ex-reps-${exercise.id}`}
                                onBlur={(e) => updateExercise(exercise.id, 'reps', e.target.value || null)}
                                className="w-16 bg-[#1f1f2e] rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[#6b6b80] mb-0.5">Rest (s)</label>
                              <input type="number" defaultValue={exercise.rest_seconds || ''}
                                key={`ex-rest-${exercise.id}`}
                                onBlur={(e) => updateExercise(exercise.id, 'rest_seconds', e.target.value ? Number(e.target.value) : null)}
                                className="w-14 bg-[#1f1f2e] rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[#6b6b80] mb-0.5">RPE</label>
                              <input type="number" min={1} max={10} defaultValue={exercise.rpe || ''}
                                key={`ex-rpe-${exercise.id}`}
                                onBlur={(e) => updateExercise(exercise.id, 'rpe', e.target.value ? Number(e.target.value) : null)}
                                className="w-12 bg-[#1f1f2e] rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[#6b6b80] mb-0.5">Tempo</label>
                              <input defaultValue={exercise.tempo || ''}
                                key={`ex-tempo-${exercise.id}`}
                                onBlur={(e) => updateExercise(exercise.id, 'tempo', e.target.value || null)}
                                placeholder="3-1-2-0"
                                className="w-20 bg-[#1f1f2e] rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50 placeholder:text-[#3a3a4a]"
                              />
                            </div>
                          </div>

                          {/* Editable notes */}
                          <textarea
                            defaultValue={exercise.notes || ''}
                            key={`ex-notes-${exercise.id}`}
                            onBlur={(e) => updateExercise(exercise.id, 'notes', e.target.value || null)}
                            rows={1}
                            placeholder="Add notes..."
                            className="w-full bg-transparent text-xs text-[#6b6b80] italic focus:outline-none focus:text-[#a0a0b8] resize-none placeholder:text-[#3a3a4a] border-b border-transparent focus:border-[#2a2a3a]"
                          />
                        </div>

                        <button onClick={() => deleteExercise(exercise.id)}
                          className="text-[#4a4a5a] hover:text-[#ff5252] transition-colors cursor-pointer pt-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>

                <button onClick={() => addExercise(selectedWorkout.id)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#00E5CC] hover:text-[#00CCBB] transition-colors cursor-pointer">
                  <Plus className="h-4 w-4" /> Add Exercise
                </button>
              </>
            ) : (
              /* ─── Program Settings Panel ─── */
              <>
                <div className="flex items-center gap-2 mb-6">
                  <Settings className="h-5 w-5 text-[#00E5CC]" />
                  <h2 className="text-lg font-bold text-white">Program Settings</h2>
                </div>

                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Program Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-[#00E5CC]/50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe your program — who it's for, what they'll achieve..."
                      className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E5CC]/50 resize-none placeholder:text-[#4a4a5a]"
                    />
                  </div>

                  {/* Cover Image */}
                  <div>
                    <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Cover Image</label>
                    {coverImageUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#2a2a3a] h-40 group">
                        <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <label className="px-3 py-1.5 rounded-lg bg-[#00E5CC] text-xs font-semibold text-white cursor-pointer hover:bg-[#00CCBB] transition-colors">
                            Replace
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const url = await uploadProgramCover(program.id, file);
                                  setCoverImageUrl(url);
                                } catch (err) {
                                  console.error('Cover upload failed:', err);
                                }
                              }}
                            />
                          </label>
                          <button
                            onClick={() => setCoverImageUrl('')}
                            className="px-3 py-1.5 rounded-lg bg-red-500/80 text-xs font-semibold text-white cursor-pointer hover:bg-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#2a2a3a] hover:border-[#00E5CC]/30 transition-colors p-8 cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-[#00E5CC]/10 flex items-center justify-center mb-2">
                          <Plus className="h-5 w-5 text-[#00E5CC]" />
                        </div>
                        <p className="text-sm text-[#6b6b80] mb-0.5">Click to upload cover image</p>
                        <p className="text-xs text-[#4a4a5a]">JPG, PNG. Recommended 1200×600</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadProgramCover(program.id, file);
                              setCoverImageUrl(url);
                            } catch (err) {
                              console.error('Cover upload failed:', err);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Goal + Discipline + Level row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Goal</label>
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E5CC]/50 cursor-pointer"
                      >
                        <option value="">Select...</option>
                        {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Discipline</label>
                      <select
                        value={discipline}
                        onChange={(e) => setDiscipline(e.target.value)}
                        className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E5CC]/50 cursor-pointer"
                      >
                        <option value="">Select...</option>
                        {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Level</label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E5CC]/50 cursor-pointer"
                      >
                        <option value="">All levels</option>
                        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-2">Equipment Required</label>
                    <div className="flex flex-wrap gap-2">
                      {EQUIPMENT.map((item) => (
                        <button
                          key={item}
                          onClick={() => toggleEquipment(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            equipment.includes(item)
                              ? 'bg-[#00E5CC] text-white'
                              : 'bg-[#15151f] text-[#6b6b80] border border-[#2a2a3a] hover:border-[#00E5CC]/30'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Credit Cost */}
                  <div>
                    <label className="block text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-1.5">Credit Cost</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={creditCost}
                        onChange={(e) => setCreditCost(Number(e.target.value) || 1)}
                        className="w-20 rounded-xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-sm font-bold text-white text-center focus:outline-none focus:border-[#00E5CC]/50"
                      />
                      <span className="text-xs text-[#6b6b80]">credit{creditCost !== 1 ? 's' : ''} to activate</span>
                    </div>
                  </div>

                  {/* Stats summary */}
                  <div className="rounded-xl border border-[#2a2a3a] bg-[#15151f] p-4">
                    <h4 className="text-[10px] text-[#6b6b80] uppercase tracking-[1px] mb-3">Program Overview</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#00E5CC]">{initialWeeks.length}</p>
                        <p className="text-[11px] text-[#6b6b80]">Weeks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#00E5CC]">{totalWorkouts}</p>
                        <p className="text-[11px] text-[#6b6b80]">Workouts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#00E5CC]">{totalExercises}</p>
                        <p className="text-[11px] text-[#6b6b80]">Exercises</p>
                      </div>
                    </div>
                  </div>

                  {/* Save reminder */}
                  <p className="text-xs text-[#4a4a5a] text-center">
                    Click <strong className="text-[#6b6b80]">Save</strong> in the top bar to persist changes
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

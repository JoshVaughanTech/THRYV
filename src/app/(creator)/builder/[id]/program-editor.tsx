'use client';

import { useState } from 'react';
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
  Upload,
  Video,
  Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const GOALS = ['Build Muscle', 'Lose Fat', 'Improve Strength', 'Athletic Performance', 'General Fitness'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const DISCIPLINES = ['Strength', 'Hypertrophy', 'HIIT', 'Endurance', 'Mobility', 'Sport-Specific'];

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
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // 3-panel state
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(
    initialWeeks[0]?.id || null
  );
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(
    new Set(initialWeeks.map((w: any) => w.id))
  );

  const router = useRouter();
  const supabase = createClient();

  // Drag state
  const [draggedExercise, setDraggedExercise] = useState<string | null>(null);

  const selectedWeek = initialWeeks.find((w: any) => w.id === selectedWeekId);
  const selectedWorkout = selectedWeek?.workouts
    ?.sort((a: any, b: any) => a.order_index - b.order_index)
    ?.find((w: any) => w.id === selectedWorkoutId);

  function toggleWeek(weekId: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from('programs')
      .update({
        title,
        description,
        goal: goal || null,
        discipline: discipline || null,
        experience_level: experienceLevel || null,
        credit_cost: creditCost,
        cover_image_url: coverImageUrl || null,
      })
      .eq('id', program.id);
    setSaving(false);
    router.refresh();
  }

  async function handlePublish() {
    setPublishing(true);
    const newStatus = program.status === 'published' ? 'unpublished' : 'published';
    await supabase
      .from('programs')
      .update({ status: newStatus })
      .eq('id', program.id);
    setPublishing(false);
    router.refresh();
  }

  async function addWorkout(weekId: string, programId: string) {
    const { data: existing } = await supabase
      .from('workouts')
      .select('order_index')
      .eq('week_id', weekId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

    const { data } = await supabase.from('workouts').insert({
      week_id: weekId,
      program_id: programId,
      title: 'New Workout',
      order_index: nextOrder,
    }).select().single();

    if (data) setSelectedWorkoutId(data.id);
    router.refresh();
  }

  async function addExercise(workoutId: string) {
    const { data: existing } = await supabase
      .from('exercises')
      .select('order_index')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

    await supabase.from('exercises').insert({
      workout_id: workoutId,
      name: 'New Exercise',
      order_index: nextOrder,
    });
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
    router.refresh();
  }

  async function deleteExercise(exerciseId: string) {
    await supabase.from('exercises').delete().eq('id', exerciseId);
    router.refresh();
  }

  async function handleExerciseDrop(exerciseId: string, targetIndex: number) {
    if (!selectedWorkout) return;
    const exercises = [...(selectedWorkout.exercises || [])].sort(
      (a: any, b: any) => a.order_index - b.order_index
    );
    const moved = exercises.find((e: any) => e.id === exerciseId);
    if (!moved) return;

    const filtered = exercises.filter((e: any) => e.id !== exerciseId);
    filtered.splice(targetIndex, 0, moved);

    // Update order_index for all
    await Promise.all(
      filtered.map((e: any, i: number) =>
        supabase.from('exercises').update({ order_index: i }).eq('id', e.id)
      )
    );
    router.refresh();
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary bg-bg-secondary">
        <Link
          href="/builder"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Programs
        </Link>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              program.status === 'published' ? 'success' : program.status === 'draft' ? 'warning' : 'default'
            }
          >
            {program.status}
          </Badge>
          <Button variant="secondary" size="sm" onClick={handlePublish} loading={publishing} className="gap-1.5">
            {program.status === 'published' ? (
              <><EyeOff className="h-4 w-4" /> Unpublish</>
            ) : (
              <><Eye className="h-4 w-4" /> Publish</>
            )}
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving} className="gap-1.5">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Navigation sidebar */}
        <div className="w-[220px] border-r border-border-primary bg-bg-secondary overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <p className="text-[10px] text-text-muted uppercase tracking-[1px] font-medium mb-2 px-2">
              Program Structure
            </p>
            {initialWeeks.map((week: any) => (
              <div key={week.id} className="mb-1">
                <button
                  onClick={() => {
                    toggleWeek(week.id);
                    setSelectedWeekId(week.id);
                  }}
                  className={`flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    selectedWeekId === week.id
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  }`}
                >
                  {expandedWeeks.has(week.id) ? (
                    <ChevronDown className="h-3 w-3 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 flex-shrink-0" />
                  )}
                  Week {week.week_number}
                  <span className="ml-auto text-text-muted text-[10px]">
                    {week.workouts?.length || 0}
                  </span>
                </button>

                {expandedWeeks.has(week.id) && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    {week.workouts
                      ?.sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((workout: any) => (
                        <button
                          key={workout.id}
                          onClick={() => {
                            setSelectedWeekId(week.id);
                            setSelectedWorkoutId(workout.id);
                          }}
                          className={`flex items-center gap-1.5 w-full rounded px-2 py-1 text-[11px] transition-colors cursor-pointer truncate ${
                            selectedWorkoutId === workout.id
                              ? 'bg-accent-primary/10 text-accent-primary'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          <Dumbbell className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{workout.title}</span>
                        </button>
                      ))}
                    <button
                      onClick={() => addWorkout(week.id, program.id)}
                      className="flex items-center gap-1 w-full px-2 py-1 text-[10px] text-accent-primary hover:text-accent-primary-hover transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      Add Workout
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Program details / Workout structure (320px) */}
        <div className="w-[320px] border-r border-border-primary overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Program Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-text-muted uppercase tracking-[0.5px] mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border-primary bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted uppercase tracking-[0.5px] mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border-primary bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-text-muted uppercase tracking-[0.5px] mb-1">Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full rounded-lg border border-border-primary bg-bg-card px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                  >
                    <option value="">Select</option>
                    {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text-muted uppercase tracking-[0.5px] mb-1">Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full rounded-lg border border-border-primary bg-bg-card px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                  >
                    <option value="">Select</option>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-text-muted uppercase tracking-[0.5px] mb-1">Discipline</label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className="w-full rounded-lg border border-border-primary bg-bg-card px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                  >
                    <option value="">Select</option>
                    {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text-muted uppercase tracking-[0.5px] mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    value={creditCost}
                    onChange={(e) => setCreditCost(Number(e.target.value))}
                    className="w-full rounded-lg border border-border-primary bg-bg-card px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-text-muted uppercase tracking-[0.5px] mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-border-primary bg-bg-card px-3 py-2 text-xs text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Exercise editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {selectedWorkout ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <input
                      defaultValue={selectedWorkout.title}
                      onBlur={(e) => updateWorkout(selectedWorkout.id, 'title', e.target.value)}
                      className="text-lg font-semibold bg-transparent text-text-primary focus:outline-none border-b-2 border-transparent focus:border-accent-primary"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        defaultValue={selectedWorkout.estimated_duration || ''}
                        onBlur={(e) =>
                          updateWorkout(selectedWorkout.id, 'estimated_duration', e.target.value ? Number(e.target.value) : null)
                        }
                        placeholder="--"
                        className="w-10 bg-transparent text-sm text-text-muted text-center focus:outline-none border-b border-transparent focus:border-accent-primary"
                      />
                      <span className="text-xs text-text-muted">min</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteWorkout(selectedWorkout.id)}
                    className="text-text-muted hover:text-error transition-colors cursor-pointer p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Exercises */}
                <div className="space-y-2">
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
                        className={`flex items-start gap-3 rounded-xl border bg-bg-card p-4 transition-all ${
                          draggedExercise === exercise.id
                            ? 'border-accent-primary/50 opacity-50'
                            : 'border-border-primary'
                        }`}
                      >
                        {/* Drag handle */}
                        <div className="cursor-grab active:cursor-grabbing pt-1 text-text-hint hover:text-text-muted transition-colors">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        {/* Exercise number */}
                        <div className="w-6 h-6 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-accent-primary">{index + 1}</span>
                        </div>

                        {/* Exercise details */}
                        <div className="flex-1 space-y-2">
                          <input
                            defaultValue={exercise.name}
                            onBlur={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                            className="w-full bg-transparent text-sm font-medium text-text-primary focus:outline-none border-b border-transparent focus:border-accent-primary"
                            placeholder="Exercise name"
                          />
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] text-text-muted uppercase">Sets</label>
                              <input
                                type="number"
                                defaultValue={exercise.sets || ''}
                                onBlur={(e) =>
                                  updateExercise(exercise.id, 'sets', e.target.value ? Number(e.target.value) : null)
                                }
                                className="w-12 bg-bg-tertiary rounded px-2 py-1 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] text-text-muted uppercase">Reps</label>
                              <input
                                defaultValue={exercise.reps || ''}
                                onBlur={(e) => updateExercise(exercise.id, 'reps', e.target.value || null)}
                                className="w-16 bg-bg-tertiary rounded px-2 py-1 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                                placeholder="e.g. 8"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] text-text-muted uppercase">Rest</label>
                              <input
                                type="number"
                                defaultValue={exercise.rest_seconds || ''}
                                onBlur={(e) =>
                                  updateExercise(exercise.id, 'rest_seconds', e.target.value ? Number(e.target.value) : null)
                                }
                                className="w-14 bg-bg-tertiary rounded px-2 py-1 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                                placeholder="sec"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] text-text-muted uppercase">RPE</label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                defaultValue={exercise.rpe || ''}
                                onBlur={(e) =>
                                  updateExercise(exercise.id, 'rpe', e.target.value ? Number(e.target.value) : null)
                                }
                                className="w-12 bg-bg-tertiary rounded px-2 py-1 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <input
                            defaultValue={exercise.notes || ''}
                            onBlur={(e) => updateExercise(exercise.id, 'notes', e.target.value || null)}
                            className="w-full bg-transparent text-xs text-text-muted focus:outline-none border-b border-transparent focus:border-accent-primary"
                            placeholder="Coach notes..."
                          />

                          {/* Video URL */}
                          <div className="flex items-center gap-2">
                            <Video className="h-3 w-3 text-text-hint flex-shrink-0" />
                            <input
                              defaultValue={exercise.video_url || ''}
                              onBlur={(e) => updateExercise(exercise.id, 'video_url', e.target.value || null)}
                              className="flex-1 bg-transparent text-xs text-text-muted focus:outline-none border-b border-transparent focus:border-accent-primary"
                              placeholder="Paste YouTube/Vimeo link or drag video"
                            />
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => deleteExercise(exercise.id)}
                          className="text-text-hint hover:text-error transition-colors cursor-pointer pt-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  onClick={() => addExercise(selectedWorkout.id)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent-primary hover:text-accent-primary-hover transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Exercise
                </button>

                {/* Media Upload Zone */}
                <div className="mt-6 rounded-xl border-2 border-dashed border-border-primary hover:border-accent-primary/30 transition-colors p-8 text-center">
                  <Upload className="h-8 w-8 text-text-hint mx-auto mb-3" />
                  <p className="text-sm text-text-muted mb-1">Drag video here or paste a link above</p>
                  <p className="text-xs text-text-hint">Supports YouTube, Vimeo, or direct upload</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Dumbbell className="h-12 w-12 text-text-hint mb-4" />
                <p className="text-text-muted mb-1">Select a workout to edit</p>
                <p className="text-xs text-text-hint">
                  Choose from the sidebar or add a new workout to a week
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

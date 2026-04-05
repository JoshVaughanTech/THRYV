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

  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(
    initialWeeks[0]?.id || null
  );
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(
    new Set(initialWeeks.length > 0 ? [initialWeeks[0].id] : [])
  );

  const router = useRouter();
  const supabase = createClient();
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
    await supabase.from('programs').update({
      title, description, goal: goal || null, discipline: discipline || null,
      experience_level: experienceLevel || null, credit_cost: creditCost,
      cover_image_url: coverImageUrl || null,
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

  async function addWorkout(weekId: string, programId: string) {
    const { data: existing } = await supabase.from('workouts').select('order_index')
      .eq('week_id', weekId).order('order_index', { ascending: false }).limit(1);
    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
    const { data } = await supabase.from('workouts').insert({
      week_id: weekId, program_id: programId, title: 'New Workout', order_index: nextOrder,
    }).select().single();
    if (data) setSelectedWorkoutId(data.id);
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
    router.refresh();
  }

  async function deleteExercise(exerciseId: string) {
    await supabase.from('exercises').delete().eq('id', exerciseId);
    router.refresh();
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
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1E1E1E] bg-[#0A0A0A]">
        <Link href="/builder" className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-[#888888] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
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

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Program structure */}
        <div className="w-[380px] border-r border-[#1E1E1E] overflow-y-auto flex-shrink-0 bg-[#0A0A0A]">
          <div className="p-5">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-[#555555]" />
              Program structure
            </h2>

            {/* Program info card */}
            <div className="rounded-xl border border-[#1E1E1E] bg-[#141414] p-4 mb-5">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-bold bg-transparent text-white focus:outline-none w-full mb-1 border-b border-transparent focus:border-[#B4F000]"
              />
              <p className="text-xs text-[#555555] mb-3">
                {program.duration_weeks} weeks &middot; {experienceLevel || 'All levels'} &middot; {discipline || 'General'}
              </p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] ${
                  program.status === 'published'
                    ? 'bg-[#1A2A0A] text-[#B4F000]'
                    : 'bg-[#1A1A1A] text-[#555555]'
                }`}>
                  {program.status === 'published' ? 'Published' : program.status}
                </span>
                <span className="text-[10px] text-[#555555] uppercase tracking-[0.5px]">{creditCost} credit{creditCost !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Week tree */}
            <div className="space-y-1">
              {initialWeeks.map((week: any) => {
                const isExpanded = expandedWeeks.has(week.id);
                const isSelectedWeek = selectedWeekId === week.id;
                const workouts = week.workouts?.sort((a: any, b: any) => a.order_index - b.order_index) || [];

                return (
                  <div key={week.id}>
                    <button
                      onClick={() => { toggleWeek(week.id); setSelectedWeekId(week.id); }}
                      className={`flex items-center justify-between w-full rounded-xl px-4 py-3 text-sm transition-all cursor-pointer ${
                        isSelectedWeek && isExpanded
                          ? 'bg-[#B4F000]/10 border border-[#B4F000]/30'
                          : 'border border-transparent hover:bg-[#141414]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded
                          ? <ChevronDown className="h-3.5 w-3.5 text-[#888888]" />
                          : <ChevronRight className="h-3.5 w-3.5 text-[#888888]" />
                        }
                        <span className={`font-medium ${isSelectedWeek ? 'text-[#B4F000]' : 'text-white'}`}>
                          Week {week.week_number}
                        </span>
                      </div>
                      <span className="text-xs text-[#555555]">
                        {workouts.length} workout{workouts.length !== 1 ? 's' : ''}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {workouts.map((workout: any) => (
                          <button
                            key={workout.id}
                            onClick={() => { setSelectedWeekId(week.id); setSelectedWorkoutId(workout.id); }}
                            className={`flex items-center justify-between w-full rounded-lg px-4 py-2 text-[13px] transition-all cursor-pointer ${
                              selectedWorkoutId === workout.id
                                ? 'bg-[#B4F000] text-[#0A0A0A] font-medium'
                                : 'text-[#888888] hover:bg-[#141414] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                selectedWorkoutId === workout.id ? 'bg-[#0A0A0A]' : 'bg-[#B4F000]'
                              }`} />
                              <span className="truncate">{workout.title}</span>
                            </div>
                            <span className={`text-[11px] ${selectedWorkoutId === workout.id ? 'text-[#0A0A0A]/60' : 'text-[#555555]'}`}>
                              {workout.exercises?.length || 0} ex
                            </span>
                          </button>
                        ))}

                        <button
                          onClick={() => addWorkout(week.id, program.id)}
                          className="flex items-center gap-1.5 w-full px-4 py-2 text-[12px] text-[#555555] hover:text-[#B4F000] transition-colors cursor-pointer"
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

            {/* Add week placeholder */}
            <button className="flex items-center justify-center gap-2 w-full mt-4 rounded-xl border border-dashed border-[#1E1E1E] py-3 text-xs text-[#555555] hover:text-[#888888] hover:border-[#888888] transition-colors cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              Add week
            </button>
          </div>
        </div>

        {/* Panel 2: Exercise editor */}
        <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
          <div className="p-6">
            {selectedWorkout ? (
              <>
                {/* Breadcrumb */}
                <p className="text-xs text-[#555555] mb-2">
                  Week {selectedWeek?.week_number} &middot; Workout {
                    (selectedWeek?.workouts?.sort((a: any, b: any) => a.order_index - b.order_index)
                      .findIndex((w: any) => w.id === selectedWorkoutId) ?? 0) + 1
                  } of {selectedWeek?.workouts?.length || 0}
                </p>

                {/* Workout name */}
                <div className="mb-6">
                  <label className="block text-[10px] text-[#555555] uppercase tracking-[1px] mb-1.5">Workout Name</label>
                  <input
                    defaultValue={selectedWorkout.title}
                    onBlur={(e) => updateWorkout(selectedWorkout.id, 'title', e.target.value)}
                    className="w-full rounded-xl border border-[#1E1E1E] bg-[#141414] px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-[#B4F000]/50"
                  />
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
                        className={`flex items-start gap-3 rounded-xl border bg-[#141414] p-4 transition-all ${
                          draggedExercise === exercise.id ? 'border-[#B4F000]/50 opacity-50' : 'border-[#1E1E1E]'
                        }`}
                      >
                        <div className="cursor-grab active:cursor-grabbing pt-1 text-[#444444] hover:text-[#888888] transition-colors">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        <div className="w-8 h-8 rounded-lg bg-[#B4F000] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#0A0A0A]">{index + 1}</span>
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            defaultValue={exercise.name}
                            onBlur={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                            className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-transparent focus:border-[#B4F000]"
                          />
                          <div className="flex items-center gap-4">
                            <div>
                              <label className="block text-[10px] text-[#555555] mb-0.5">Sets</label>
                              <input type="number" defaultValue={exercise.sets || ''}
                                onBlur={(e) => updateExercise(exercise.id, 'sets', e.target.value ? Number(e.target.value) : null)}
                                className="w-12 bg-[#1A1A1A] rounded px-2 py-1 text-sm font-bold text-white text-center focus:outline-none focus:ring-1 focus:ring-[#B4F000]/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[#555555] mb-0.5">Reps</label>
                              <input defaultValue={exercise.reps || ''}
                                onBlur={(e) => updateExercise(exercise.id, 'reps', e.target.value || null)}
                                className="w-16 bg-[#1A1A1A] rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#B4F000]/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[#555555] mb-0.5">Rest</label>
                              <input type="number" defaultValue={exercise.rest_seconds || ''}
                                onBlur={(e) => updateExercise(exercise.id, 'rest_seconds', e.target.value ? Number(e.target.value) : null)}
                                className="w-14 bg-[#1A1A1A] rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#B4F000]/50"
                                placeholder="sec"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-[#555555] mb-0.5">RPE</label>
                              <input type="number" min={1} max={10} defaultValue={exercise.rpe || ''}
                                onBlur={(e) => updateExercise(exercise.id, 'rpe', e.target.value ? Number(e.target.value) : null)}
                                className="w-12 bg-[#1A1A1A] rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#B4F000]/50"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-[#555555] italic">
                            {exercise.notes || 'No notes'}
                          </p>
                        </div>

                        <button onClick={() => deleteExercise(exercise.id)}
                          className="text-[#444444] hover:text-[#E24B4A] transition-colors cursor-pointer pt-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>

                <button onClick={() => addExercise(selectedWorkout.id)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#B4F000] hover:text-[#C5F53A] transition-colors cursor-pointer">
                  <Plus className="h-4 w-4" /> Add Exercise
                </button>

                {/* Video / Media */}
                <div className="mt-8">
                  <h3 className="text-[10px] text-[#555555] uppercase tracking-[1px] font-medium mb-3">Video / Media</h3>
                  <div className="rounded-xl border-2 border-dashed border-[#1E1E1E] hover:border-[#B4F000]/30 transition-colors p-8 text-center">
                    <Upload className="h-8 w-8 text-[#444444] mx-auto mb-3" />
                    <p className="text-sm text-[#555555] mb-1">Drop video or paste a link</p>
                    <p className="text-xs text-[#444444]">MP4, YouTube, Vimeo</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <Dumbbell className="h-12 w-12 text-[#444444] mb-4" />
                <p className="text-[#888888] mb-1">Select a workout to edit</p>
                <p className="text-xs text-[#555555]">Choose from the program structure</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

-- ============================================================
-- THRYV Fitness Platform — Seed Data
-- ============================================================
-- Run this in the Supabase SQL Editor after you have signed up
-- with at least one account. This script will:
--   1. Promote your existing user to admin
--   2. Create a creator profile for that user
--   3. Insert 3 programs with weeks, workouts, and exercises
--
-- All IDs are chained via PL/pgSQL variables so foreign keys
-- stay consistent. Safe to run multiple times if you TRUNCATE
-- the tables first (see cleanup block at the bottom).
-- ============================================================

DO $$
DECLARE
  -- User / creator
  v_user_id   UUID;
  v_creator_id UUID;

  -- Programs
  v_prog_hyper  UUID;
  v_prog_shred  UUID;
  v_prog_str    UUID;

  -- Week IDs — Hypertrophy (8 weeks)
  v_hyp_w1 UUID; v_hyp_w2 UUID; v_hyp_w3 UUID; v_hyp_w4 UUID;
  v_hyp_w5 UUID; v_hyp_w6 UUID; v_hyp_w7 UUID; v_hyp_w8 UUID;

  -- Week IDs — Shred 30 (4 weeks)
  v_shr_w1 UUID; v_shr_w2 UUID; v_shr_w3 UUID; v_shr_w4 UUID;

  -- Week IDs — Strength Protocol (12 weeks)
  v_str_w1  UUID; v_str_w2  UUID; v_str_w3  UUID; v_str_w4  UUID;
  v_str_w5  UUID; v_str_w6  UUID; v_str_w7  UUID; v_str_w8  UUID;
  v_str_w9  UUID; v_str_w10 UUID; v_str_w11 UUID; v_str_w12 UUID;

  -- Reusable workout ID for inserting exercises
  v_wo UUID;

BEGIN
  -- ==========================================================
  -- 1. GET THE EXISTING USER
  -- ==========================================================
  SELECT id INTO v_user_id
  FROM public.profiles
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No profiles found. Sign up first, then run this seed.';
  END IF;

  RAISE NOTICE 'Using user ID: %', v_user_id;

  -- ==========================================================
  -- 2. PROMOTE USER TO ADMIN
  -- ==========================================================
  UPDATE public.profiles
  SET role = 'admin',
      onboarding_completed = TRUE,
      full_name = COALESCE(NULLIF(full_name, ''), 'THRYV Admin'),
      goals = ARRAY['Build Muscle', 'Improve Strength'],
      experience_level = 'advanced',
      equipment = ARRAY['Full Gym'],
      time_availability = '60-90 min'
  WHERE id = v_user_id;

  RAISE NOTICE 'User promoted to admin.';

  -- ==========================================================
  -- 3. CREATE CREATOR PROFILE
  -- ==========================================================
  INSERT INTO public.creators (user_id, bio, credentials, video_url, approved)
  VALUES (
    v_user_id,
    'Certified strength & conditioning coach with 10+ years of experience helping athletes and everyday lifters reach their potential.',
    'CSCS, NSCA-CPT, BS Exercise Science',
    'https://www.youtube.com/watch?v=example',
    TRUE
  )
  ON CONFLICT (user_id) DO UPDATE SET approved = TRUE
  RETURNING id INTO v_creator_id;

  RAISE NOTICE 'Creator profile created: %', v_creator_id;

  -- ==========================================================
  -- 4. CREATE SUBSCRIPTION (trial)
  -- ==========================================================
  INSERT INTO public.subscriptions (user_id, status, trial_start, trial_end)
  VALUES (
    v_user_id,
    'trial',
    NOW(),
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Grant trial credits
  INSERT INTO public.credit_ledger (user_id, amount, event_type, description)
  VALUES (v_user_id, 3, 'trial_grant', 'Trial signup — 3 free credits');

  -- ==========================================================
  -- 5. CREATE PROGRAMS
  -- ==========================================================

  -- Program 1: Hypertrophy Fundamentals
  INSERT INTO public.programs (
    creator_id, title, description, goal, discipline,
    experience_level, equipment, duration_weeks, credit_cost, status
  ) VALUES (
    v_creator_id,
    'Hypertrophy Fundamentals',
    'A comprehensive 8-week muscle-building program designed around progressive overload and volume accumulation. Perfect for intermediate lifters looking to pack on quality size.',
    'Build Muscle',
    'Hypertrophy',
    'intermediate',
    ARRAY['Barbell', 'Dumbbells', 'Cable Machine', 'Bench'],
    8, 1, 'published'
  ) RETURNING id INTO v_prog_hyper;

  -- Program 2: Shred 30
  INSERT INTO public.programs (
    creator_id, title, description, goal, discipline,
    experience_level, equipment, duration_weeks, credit_cost, status
  ) VALUES (
    v_creator_id,
    'Shred 30',
    'A high-intensity 4-week fat-loss program combining HIIT circuits with strategic resistance training. Designed to maximise calorie burn while preserving lean muscle.',
    'Lose Fat',
    'HIIT',
    'beginner',
    ARRAY['Dumbbells', 'Kettlebell', 'Bodyweight'],
    4, 1, 'published'
  ) RETURNING id INTO v_prog_shred;

  -- Program 3: Strength Protocol
  INSERT INTO public.programs (
    creator_id, title, description, goal, discipline,
    experience_level, equipment, duration_weeks, credit_cost, status
  ) VALUES (
    v_creator_id,
    'Strength Protocol',
    'A 12-week periodised strength program built on the big three lifts (squat, bench, deadlift). Includes accessory work and deload weeks for long-term progress.',
    'Improve Strength',
    'Strength',
    'advanced',
    ARRAY['Barbell', 'Power Rack', 'Bench', 'Dumbbells'],
    12, 1, 'published'
  ) RETURNING id INTO v_prog_str;

  RAISE NOTICE 'Programs created.';

  -- ==========================================================
  -- 6. PROGRAM WEEKS
  -- ==========================================================

  -- Hypertrophy Fundamentals — 8 weeks
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_hyper, 1, 'Foundation') RETURNING id INTO v_hyp_w1;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_hyper, 2, 'Volume Ramp') RETURNING id INTO v_hyp_w2;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_hyper, 3, 'Progressive Overload') RETURNING id INTO v_hyp_w3;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_hyper, 4, 'Intensity Phase') RETURNING id INTO v_hyp_w4;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_hyper, 5, 'Deload') RETURNING id INTO v_hyp_w5;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_hyper, 6, 'Volume Peak') RETURNING id INTO v_hyp_w6;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_hyper, 7, 'Intensification') RETURNING id INTO v_hyp_w7;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_hyper, 8, 'Final Push') RETURNING id INTO v_hyp_w8;

  -- Shred 30 — 4 weeks
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_shred, 1, 'Ignition') RETURNING id INTO v_shr_w1;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_shred, 2, 'Metabolic Surge') RETURNING id INTO v_shr_w2;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_shred, 3, 'Peak Intensity') RETURNING id INTO v_shr_w3;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_shred, 4, 'Burnout') RETURNING id INTO v_shr_w4;

  -- Strength Protocol — 12 weeks
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 1,  'Base Building')     RETURNING id INTO v_str_w1;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 2,  'Volume Block 1')    RETURNING id INTO v_str_w2;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 3,  'Volume Block 2')    RETURNING id INTO v_str_w3;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 4,  'Deload 1')          RETURNING id INTO v_str_w4;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 5,  'Intensity Block 1') RETURNING id INTO v_str_w5;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 6,  'Intensity Block 2') RETURNING id INTO v_str_w6;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 7,  'Intensity Block 3') RETURNING id INTO v_str_w7;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 8,  'Deload 2')          RETURNING id INTO v_str_w8;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 9,  'Peaking Block 1')   RETURNING id INTO v_str_w9;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 10, 'Peaking Block 2')   RETURNING id INTO v_str_w10;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 11, 'Peaking Block 3')   RETURNING id INTO v_str_w11;
  INSERT INTO public.program_weeks (program_id, week_number, title) VALUES (v_prog_str, 12, 'Test Week')         RETURNING id INTO v_str_w12;

  RAISE NOTICE 'Weeks created.';

  -- ==========================================================
  -- 7. WORKOUTS + 8. EXERCISES
  -- ==========================================================
  -- Helper pattern: insert a workout, capture its ID into v_wo,
  -- then insert exercises referencing v_wo.

  -- --------------------------------------------------------
  -- HYPERTROPHY FUNDAMENTALS — Week 1
  -- --------------------------------------------------------

  -- Day 1: Upper Push
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w1, v_prog_hyper, 'Upper Push', 0, 60, 1) RETURNING id INTO v_wo;

  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',   4, '8-10',  'Control the eccentric for 2-3 seconds', 0),
    (v_wo, 'Incline Dumbbell Press', 3, '10-12', 'Slight incline, 30 degrees',            1),
    (v_wo, 'Overhead Press',         3, '8-10',  'Standing or seated',                     2),
    (v_wo, 'Lateral Raises',         3, '12-15', 'Slow and controlled',                    3),
    (v_wo, 'Tricep Pushdowns',       3, '12-15', 'Rope attachment',                        4),
    (v_wo, 'Overhead Tricep Extension', 2, '12-15', 'Cable or dumbbell',                   5);

  -- Day 2: Lower
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w1, v_prog_hyper, 'Lower Body', 1, 65, 2) RETURNING id INTO v_wo;

  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',    4, '8-10',  'Hit parallel or below',             0),
    (v_wo, 'Romanian Deadlift',     3, '10-12', 'Feel the hamstring stretch',         1),
    (v_wo, 'Leg Press',             3, '10-12', 'Feet shoulder width',                2),
    (v_wo, 'Walking Lunges',        3, '12 each', 'Dumbbells at sides',              3),
    (v_wo, 'Leg Curl',              3, '12-15', 'Squeeze at the top',                 4),
    (v_wo, 'Standing Calf Raises',  4, '15-20', 'Full range of motion',              5);

  -- Day 3: Upper Pull
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w1, v_prog_hyper, 'Upper Pull', 2, 60, 4) RETURNING id INTO v_wo;

  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Pull-ups',              4, '6-10',  'Add weight if bodyweight is too easy', 0),
    (v_wo, 'Barbell Bent-Over Row', 4, '8-10',  'Keep back flat',                       1),
    (v_wo, 'Seated Cable Row',      3, '10-12', 'Squeeze shoulder blades together',     2),
    (v_wo, 'Face Pulls',            3, '15-20', 'External rotation at the top',         3),
    (v_wo, 'Barbell Curl',          3, '10-12', 'No swinging',                          4),
    (v_wo, 'Hammer Curls',          2, '12-15', 'Alternating',                          5);

  -- Day 4: Legs & Shoulders
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w1, v_prog_hyper, 'Legs & Shoulders', 3, 55, 6) RETURNING id INTO v_wo;

  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Front Squat',          3, '8-10',  'Keep elbows high',                0),
    (v_wo, 'Bulgarian Split Squat', 3, '10 each', 'Dumbbells at sides',           1),
    (v_wo, 'Leg Extension',        3, '12-15', 'Pause at the top',                2),
    (v_wo, 'Dumbbell Shoulder Press', 3, '10-12', 'Neutral or pronated grip',     3),
    (v_wo, 'Cable Lateral Raise',  3, '12-15', 'Behind the back variation',       4);

  -- --------------------------------------------------------
  -- HYPERTROPHY FUNDAMENTALS — Week 2 (Volume Ramp)
  -- --------------------------------------------------------

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w2, v_prog_hyper, 'Push Focus', 0, 60, 1) RETURNING id INTO v_wo;

  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Dumbbell Bench Press',  4, '10-12', 'Full range of motion',     0),
    (v_wo, 'Incline Barbell Press', 4, '8-10',  'Moderate incline',          1),
    (v_wo, 'Cable Flyes',           3, '12-15', 'Squeeze at peak',           2),
    (v_wo, 'Arnold Press',          3, '10-12', 'Rotate through the press',  3),
    (v_wo, 'Dips',                  3, '10-15', 'Lean forward for chest',    4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w2, v_prog_hyper, 'Legs — Quad Focus', 1, 65, 3) RETURNING id INTO v_wo;

  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',  4, '10-12', 'Add 5 lbs from last week', 0),
    (v_wo, 'Hack Squat',          3, '10-12', 'Narrow stance for quads',   1),
    (v_wo, 'Leg Extension',       3, '12-15', 'Slow negatives',            2),
    (v_wo, 'Walking Lunges',      3, '12 each', 'Heavier than last week',  3),
    (v_wo, 'Seated Calf Raises',  4, '15-20', 'Pause at bottom stretch',  4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w2, v_prog_hyper, 'Pull Focus', 2, 60, 5) RETURNING id INTO v_wo;

  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Weighted Pull-ups',      3, '6-8',   'Add weight progressively', 0),
    (v_wo, 'T-Bar Row',              4, '8-10',  'Chest-supported if available', 1),
    (v_wo, 'Single-Arm Dumbbell Row', 3, '10-12', 'Full stretch at bottom',  2),
    (v_wo, 'Reverse Flyes',          3, '12-15', 'Rear delt focus',          3),
    (v_wo, 'EZ Bar Curl',            3, '10-12', 'Wide grip',                4),
    (v_wo, 'Incline Dumbbell Curl',  2, '12-15', 'Stretch at the bottom',   5);

  -- --------------------------------------------------------
  -- HYPERTROPHY FUNDAMENTALS — Weeks 3-8 (representative)
  -- We create 3 workouts per week for the remaining weeks
  -- --------------------------------------------------------

  -- Week 3
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w3, v_prog_hyper, 'Chest & Triceps', 0, 60, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',       4, '6-8',   'Heavier than week 2', 0),
    (v_wo, 'Incline Dumbbell Press',    4, '8-10',  'Progressive overload', 1),
    (v_wo, 'Cable Crossover',           3, '12-15', 'High to low',          2),
    (v_wo, 'Close-Grip Bench Press',    3, '8-10',  'Tricep emphasis',      3),
    (v_wo, 'Tricep Pushdowns',          3, '12-15', 'V-bar attachment',     4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w3, v_prog_hyper, 'Back & Biceps', 1, 60, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Deadlift',                  4, '5-6',   'Heavy — maintain form',  0),
    (v_wo, 'Lat Pulldown',              3, '10-12', 'Wide grip',               1),
    (v_wo, 'Seated Cable Row',          3, '10-12', 'Close grip handle',       2),
    (v_wo, 'Barbell Curl',              3, '10-12', 'Strict form',             3),
    (v_wo, 'Concentration Curl',        2, '12-15', 'Peak contraction',        4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w3, v_prog_hyper, 'Legs', 2, 65, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',   4, '6-8',   'Progressive overload',     0),
    (v_wo, 'Romanian Deadlift',    4, '8-10',  'Increase weight',           1),
    (v_wo, 'Leg Press',            3, '10-12', 'Feet high for hamstrings',  2),
    (v_wo, 'Leg Curl',             3, '12-15', 'Slow eccentric',            3),
    (v_wo, 'Standing Calf Raises', 4, '15-20', 'Full ROM',                  4);

  -- Week 4 — Intensity Phase
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w4, v_prog_hyper, 'Heavy Upper', 0, 65, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',   5, '5',     'Working up to heavy sets', 0),
    (v_wo, 'Weighted Pull-ups',     4, '5-6',   'Heavy and controlled',     1),
    (v_wo, 'Overhead Press',        4, '6-8',   'Standing strict press',    2),
    (v_wo, 'Barbell Bent-Over Row', 4, '6-8',   'Heavy rows',              3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w4, v_prog_hyper, 'Heavy Lower', 1, 65, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',  5, '5',     'Work up to top set',    0),
    (v_wo, 'Deadlift',            4, '3-5',   'Heavy singles/triples', 1),
    (v_wo, 'Front Squat',         3, '6-8',   'Moderate weight',       2),
    (v_wo, 'Leg Curl',            3, '10-12', 'Burnout set on last',   3),
    (v_wo, 'Standing Calf Raises', 4, '12-15', 'Heavy',                4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w4, v_prog_hyper, 'Pump Day', 2, 50, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Dumbbell Bench Press',  3, '15-20', 'Light and controlled',  0),
    (v_wo, 'Cable Flyes',           3, '15-20', 'Constant tension',      1),
    (v_wo, 'Lateral Raises',        4, '15-20', 'Drop sets on last',     2),
    (v_wo, 'Face Pulls',            3, '15-20', 'Rear delt pump',        3),
    (v_wo, 'Bicep Curls',           3, '15-20', 'Alternating',           4),
    (v_wo, 'Tricep Pushdowns',      3, '15-20', 'Drop sets on last',    5);

  -- Week 5 — Deload
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w5, v_prog_hyper, 'Deload Upper', 0, 40, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',   3, '8',   '60% of working max', 0),
    (v_wo, 'Pull-ups',              3, '8',   'Bodyweight only',     1),
    (v_wo, 'Overhead Press',        3, '8',   '60% of working max',  2),
    (v_wo, 'Lateral Raises',        2, '12',  'Light',               3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w5, v_prog_hyper, 'Deload Lower', 1, 40, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',   3, '8',   '60% of working max', 0),
    (v_wo, 'Romanian Deadlift',    3, '8',   'Light weight',        1),
    (v_wo, 'Leg Extension',        2, '12',  'Easy',                2),
    (v_wo, 'Leg Curl',             2, '12',  'Easy',                3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w5, v_prog_hyper, 'Deload Full Body', 2, 35, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Goblet Squat',      2, '10',  'Light and mobile',    0),
    (v_wo, 'Push-ups',          2, '15',  'Bodyweight',           1),
    (v_wo, 'Cable Row',         2, '12',  'Light',                2),
    (v_wo, 'Plank',             3, '30s', 'Core stability focus', 3);

  -- Week 6 — Volume Peak
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w6, v_prog_hyper, 'High Volume Push', 0, 70, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',     5, '8-10',  'Higher volume block',  0),
    (v_wo, 'Incline Dumbbell Press',  4, '10-12', '4 hard sets',          1),
    (v_wo, 'Machine Chest Press',     3, '12-15', 'Burnout',              2),
    (v_wo, 'Overhead Press',          4, '8-10',  'Strict form',          3),
    (v_wo, 'Lateral Raises',          4, '12-15', 'Superset with next',   4),
    (v_wo, 'Tricep Pushdowns',        4, '12-15', 'Superset with above',  5);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w6, v_prog_hyper, 'High Volume Legs', 1, 70, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',  5, '8-10',  'RPE 8-9',               0),
    (v_wo, 'Romanian Deadlift',   4, '10-12', 'Heavier than before',    1),
    (v_wo, 'Leg Press',           4, '12-15', 'High volume',            2),
    (v_wo, 'Walking Lunges',      3, '12 each', 'Heavy dumbbells',      3),
    (v_wo, 'Leg Curl',            3, '12-15', 'Superset with next',     4),
    (v_wo, 'Leg Extension',       3, '12-15', 'Superset with above',    5);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w6, v_prog_hyper, 'High Volume Pull', 2, 70, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Weighted Pull-ups',       4, '6-8',   'Add weight progressively', 0),
    (v_wo, 'Barbell Bent-Over Row',   4, '8-10',  'Heavy rows',               1),
    (v_wo, 'Seated Cable Row',        4, '10-12', 'Squeeze the contraction',  2),
    (v_wo, 'Face Pulls',              3, '15-20', 'Rear delt health',         3),
    (v_wo, 'Barbell Curl',            4, '10-12', 'Strict curls',             4),
    (v_wo, 'Hammer Curls',            3, '12-15', 'Brachialis focus',         5);

  -- Week 7 — Intensification
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w7, v_prog_hyper, 'Strength-Hypertrophy Upper', 0, 65, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',    4, '4-6',   'Heavy sets, long rest',     0),
    (v_wo, 'Weighted Pull-ups',      4, '4-6',   'Max effort',                1),
    (v_wo, 'Incline Dumbbell Press', 3, '8-10',  'Back-off sets',             2),
    (v_wo, 'Cable Row',              3, '8-10',  'Back-off sets',             3),
    (v_wo, 'Dips',                   3, '10-15', 'Bodyweight or weighted',    4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w7, v_prog_hyper, 'Strength-Hypertrophy Lower', 1, 65, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',    4, '4-6',   'Heavy working sets',      0),
    (v_wo, 'Deadlift',              3, '3-5',   'Top singles or triples',  1),
    (v_wo, 'Bulgarian Split Squat', 3, '8-10',  'Moderate weight',         2),
    (v_wo, 'Leg Curl',              3, '10-12', 'Controlled eccentric',    3),
    (v_wo, 'Standing Calf Raises',  4, '12-15', 'Heavy',                   4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w7, v_prog_hyper, 'Arms & Shoulders', 2, 50, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Dumbbell Shoulder Press', 4, '8-10',  'Moderate to heavy',      0),
    (v_wo, 'Lateral Raises',          4, '12-15', 'Slow negatives',         1),
    (v_wo, 'Barbell Curl',            3, '8-10',  'Heavy curls',            2),
    (v_wo, 'Skull Crushers',          3, '10-12', 'EZ bar',                 3),
    (v_wo, 'Hammer Curls',            2, '12-15', 'Finisher',               4);

  -- Week 8 — Final Push
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w8, v_prog_hyper, 'Max Effort Upper', 0, 70, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',    5, '3-5',   'Work up to a top set',    0),
    (v_wo, 'Weighted Pull-ups',      4, '3-5',   'Heaviest yet',            1),
    (v_wo, 'Overhead Press',         4, '5-6',   'Push for a PR',           2),
    (v_wo, 'Barbell Bent-Over Row',  4, '6-8',   'Heavy',                   3),
    (v_wo, 'Dips',                   3, 'AMRAP', 'As many reps as possible', 4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w8, v_prog_hyper, 'Max Effort Lower', 1, 70, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat', 5, '3-5',   'Work up to a top set',  0),
    (v_wo, 'Deadlift',          4, '1-3',   'Singles or heavy doubles', 1),
    (v_wo, 'Front Squat',       3, '6-8',   'Back-off volume',        2),
    (v_wo, 'Leg Curl',          3, '10-12', 'Pump work',              3),
    (v_wo, 'Plank',             3, '60s',   'Core stability',         4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_hyp_w8, v_prog_hyper, 'Finisher — Full Body Pump', 2, 45, 6) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Dumbbell Bench Press', 3, '15-20', 'Light pump',        0),
    (v_wo, 'Lat Pulldown',        3, '15-20', 'Controlled',        1),
    (v_wo, 'Goblet Squat',        3, '15-20', 'Continuous tension', 2),
    (v_wo, 'Lateral Raises',      3, '15-20', 'Burn it out',       3),
    (v_wo, 'Bicep Curls',         3, '15-20', 'Finisher',          4),
    (v_wo, 'Tricep Pushdowns',    3, '15-20', 'Finisher',          5);

  -- --------------------------------------------------------
  -- SHRED 30 — Week 1: Ignition
  -- --------------------------------------------------------

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w1, v_prog_shred, 'HIIT Circuit A', 0, 35, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Kettlebell Swings',      4, '20',   '30s rest between sets',  0),
    (v_wo, 'Burpees',                4, '10',   'Full extension at top',  1),
    (v_wo, 'Mountain Climbers',      4, '20 each', 'Fast pace',           2),
    (v_wo, 'Dumbbell Thrusters',     4, '12',   'Light to moderate',      3),
    (v_wo, 'Plank',                  3, '45s',  'Core brace',             4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w1, v_prog_shred, 'Resistance + Cardio', 1, 40, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Goblet Squat',           3, '15',   'Moderate weight',         0),
    (v_wo, 'Push-ups',               3, '15-20', 'Chest to ground',        1),
    (v_wo, 'Dumbbell Row',           3, '12 each', 'Alternate sides',      2),
    (v_wo, 'Jump Squats',            3, '15',   'Explosive',               3),
    (v_wo, 'Russian Twists',         3, '20 each', 'Dumbbell or plate',    4),
    (v_wo, 'High Knees',             3, '30s',  'Maximum effort',          5);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w1, v_prog_shred, 'HIIT Circuit B', 2, 30, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Box Jumps',              4, '10',   'Step down to save knees',  0),
    (v_wo, 'Dumbbell Snatch',        4, '8 each', 'Explosive hip drive',   1),
    (v_wo, 'Battle Ropes',           4, '30s',  'Alternating waves',        2),
    (v_wo, 'Plank to Push-up',       3, '10',   'Controlled transitions',   3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w1, v_prog_shred, 'Active Recovery', 3, 25, 7) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Yoga Flow',              1, '10 min', 'Sun salutations',       0),
    (v_wo, 'Foam Rolling',           1, '10 min', 'Hit all major groups',  1),
    (v_wo, 'Light Walking',          1, '15 min', 'Zone 2 heart rate',     2);

  -- --------------------------------------------------------
  -- SHRED 30 — Week 2: Metabolic Surge
  -- --------------------------------------------------------

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w2, v_prog_shred, 'Tabata Blitz', 0, 30, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Burpees',            8, '20s on / 10s off', 'Tabata protocol', 0),
    (v_wo, 'Kettlebell Swings',  8, '20s on / 10s off', 'Tabata protocol', 1),
    (v_wo, 'Mountain Climbers',  8, '20s on / 10s off', 'Tabata protocol', 2),
    (v_wo, 'Jump Squats',        8, '20s on / 10s off', 'Tabata protocol', 3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w2, v_prog_shred, 'Total Body Burn', 1, 40, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Dumbbell Clean & Press', 4, '10',    'Full body compound',     0),
    (v_wo, 'Renegade Rows',          3, '10 each', 'Core engaged',          1),
    (v_wo, 'Squat Jumps',            3, '15',    'Land softly',             2),
    (v_wo, 'Push-up to Row',         3, '10 each', 'Alternate arms',        3),
    (v_wo, 'Plank Jacks',            3, '20',    'Keep hips level',         4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w2, v_prog_shred, 'EMOM Challenge', 2, 35, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Kettlebell Goblet Squat', 1, '12 EMOM x 10', 'Every minute on the minute', 0),
    (v_wo, 'Push-ups',                1, '10 EMOM x 10', 'Alternate with squats',       1),
    (v_wo, 'Dumbbell Swings',         1, '15 EMOM x 10', 'Third rotation',              2),
    (v_wo, 'Burpees',                 1, '8 EMOM x 10',  'Fourth rotation',             3);

  -- --------------------------------------------------------
  -- SHRED 30 — Week 3: Peak Intensity
  -- --------------------------------------------------------

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w3, v_prog_shred, 'Superset Scorcher', 0, 40, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Dumbbell Thrusters',    4, '12',     'Superset with next',   0),
    (v_wo, 'Burpee Pull-ups',       4, '8',      'Superset with above',  1),
    (v_wo, 'Kettlebell Swings',     4, '15',     'Superset with next',   2),
    (v_wo, 'Box Jumps',             4, '10',     'Superset with above',  3),
    (v_wo, 'Plank',                 3, '60s',    'Finisher',             4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w3, v_prog_shred, 'Metabolic Resistance', 1, 40, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Goblet Squat',          4, '15',     'No rest between exercises', 0),
    (v_wo, 'Dumbbell Row',          4, '12 each', 'Straight into next',       1),
    (v_wo, 'Dumbbell Bench Press',  4, '12',     'Light weight, fast pace',   2),
    (v_wo, 'Reverse Lunges',        4, '10 each', 'Alternating',              3),
    (v_wo, 'Russian Twists',        3, '20 each', 'Core finisher',            4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w3, v_prog_shred, 'Sprint Intervals', 2, 30, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Sprint',                10, '30s on / 60s walk', 'Treadmill or outdoor', 0),
    (v_wo, 'Walking Lunges',         3, '20 each',           'Between sprint sets',  1),
    (v_wo, 'Plank Hold',             3, '45s',               'Core stability',       2);

  -- --------------------------------------------------------
  -- SHRED 30 — Week 4: Burnout
  -- --------------------------------------------------------

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w4, v_prog_shred, 'The Gauntlet', 0, 45, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Burpees',              5, '15',      'Minimal rest',            0),
    (v_wo, 'Kettlebell Swings',    5, '20',      'Heavy as possible',       1),
    (v_wo, 'Box Jumps',            5, '12',      'Explosive',               2),
    (v_wo, 'Dumbbell Thrusters',   5, '12',      'Go heavy',                3),
    (v_wo, 'Mountain Climbers',    5, '30 each', 'Sprint pace',             4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w4, v_prog_shred, 'Final Circuit', 1, 40, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Dumbbell Clean & Press', 4, '10',     '4 rounds, no rest between exercises', 0),
    (v_wo, 'Renegade Rows',          4, '10 each', 'Stay tight',             1),
    (v_wo, 'Jump Squats',            4, '15',      'Maximum height',         2),
    (v_wo, 'Push-ups',               4, 'AMRAP',   'Until failure',          3),
    (v_wo, 'Plank',                  4, '60s',     'Last hold of the program', 4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_shr_w4, v_prog_shred, 'Victory Lap', 2, 30, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Light Jog',           1, '10 min', 'Warm-up',                0),
    (v_wo, 'Sprint Intervals',    8, '20s / 40s', 'All-out sprints',     1),
    (v_wo, 'Cool-Down Walk',      1, '5 min',  'Bring heart rate down',  2),
    (v_wo, 'Foam Rolling',        1, '10 min', 'Celebrate — you did it!', 3);

  -- --------------------------------------------------------
  -- STRENGTH PROTOCOL — Week 1: Base Building
  -- --------------------------------------------------------

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w1, v_prog_str, 'Squat Day', 0, 75, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',    5, '5',     'RPE 7 — leave 3 in the tank', 0),
    (v_wo, 'Pause Squat',           3, '3',     '3-second pause at bottom',     1),
    (v_wo, 'Leg Press',             3, '10-12', 'Accessory volume',             2),
    (v_wo, 'Leg Curl',              3, '12-15', 'Hamstring balance',            3),
    (v_wo, 'Plank',                 3, '60s',   'Core stability',               4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w1, v_prog_str, 'Bench Day', 1, 70, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',    5, '5',     'RPE 7',                     0),
    (v_wo, 'Close-Grip Bench Press', 3, '8',     'Tricep accessory',          1),
    (v_wo, 'Incline Dumbbell Press', 3, '10-12', 'Upper chest volume',        2),
    (v_wo, 'Barbell Bent-Over Row',  4, '8-10',  'Back balance',              3),
    (v_wo, 'Face Pulls',             3, '15',    'Shoulder health',           4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w1, v_prog_str, 'Deadlift Day', 2, 75, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift',  5, '5',     'RPE 7',                     0),
    (v_wo, 'Deficit Deadlift',       3, '3',     '1-inch deficit',            1),
    (v_wo, 'Romanian Deadlift',      3, '8-10',  'Hamstring accessory',       2),
    (v_wo, 'Pull-ups',               3, '8-10',  'Back volume',               3),
    (v_wo, 'Ab Wheel Rollouts',      3, '10',    'Core strength',             4);

  -- --------------------------------------------------------
  -- STRENGTH PROTOCOL — Week 2: Volume Block 1
  -- --------------------------------------------------------

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w2, v_prog_str, 'Squat Volume', 0, 75, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',    5, '5',     'Add 5 lbs from week 1',  0),
    (v_wo, 'Front Squat',           3, '5',     'Moderate weight',         1),
    (v_wo, 'Bulgarian Split Squat', 3, '8 each', 'Single leg strength',   2),
    (v_wo, 'Leg Curl',              3, '12',    'Controlled eccentric',    3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w2, v_prog_str, 'Bench Volume', 1, 70, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',    5, '5',     'Add 2.5 lbs from week 1', 0),
    (v_wo, 'Overhead Press',         4, '6-8',   'Supplemental pressing',    1),
    (v_wo, 'Dumbbell Bench Press',   3, '10-12', 'Volume work',             2),
    (v_wo, 'Cable Row',              4, '10-12', 'Back balance',             3),
    (v_wo, 'Tricep Pushdowns',       3, '12-15', 'Lockout strength',        4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w2, v_prog_str, 'Deadlift Volume', 2, 75, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift',  5, '5',     'Add 5 lbs from week 1',  0),
    (v_wo, 'Paused Deadlift',        3, '3',     '2-second pause at knee',  1),
    (v_wo, 'Barbell Row',            4, '8-10',  'Heavy rows',              2),
    (v_wo, 'Pull-ups',               4, '8-10',  'Add weight if possible',  3),
    (v_wo, 'Plank',                  3, '60s',   'Core endurance',          4);

  -- --------------------------------------------------------
  -- STRENGTH PROTOCOL — Week 3: Volume Block 2
  -- --------------------------------------------------------

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w3, v_prog_str, 'Squat — Top Set', 0, 75, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',  1, '3',   'Top set at RPE 8',    0),
    (v_wo, 'Barbell Back Squat',  4, '5',   'Back-off at 85%',     1),
    (v_wo, 'Pause Squat',         3, '3',   'Heavier than week 1', 2),
    (v_wo, 'Leg Press',           3, '12',  'Volume',              3),
    (v_wo, 'Standing Calf Raises', 4, '15', 'Full ROM',            4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w3, v_prog_str, 'Bench — Top Set', 1, 70, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',    1, '3',    'Top set at RPE 8',    0),
    (v_wo, 'Barbell Bench Press',    4, '5',    'Back-off at 85%',     1),
    (v_wo, 'Close-Grip Bench Press', 3, '8',    'Tricep focus',        2),
    (v_wo, 'Barbell Bent-Over Row',  4, '8-10', 'Heavy back work',     3),
    (v_wo, 'Lateral Raises',         3, '12-15', 'Shoulder health',    4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w3, v_prog_str, 'Deadlift — Top Set', 2, 75, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift', 1, '3',    'Top set at RPE 8',    0),
    (v_wo, 'Conventional Deadlift', 4, '5',    'Back-off at 85%',     1),
    (v_wo, 'Romanian Deadlift',     3, '8-10', 'Hamstring volume',    2),
    (v_wo, 'Weighted Pull-ups',     4, '6-8',  'Pulling strength',    3),
    (v_wo, 'Ab Wheel Rollouts',     3, '10',   'Core',                4);

  -- --------------------------------------------------------
  -- STRENGTH PROTOCOL — Week 4: Deload 1
  -- --------------------------------------------------------

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w4, v_prog_str, 'Deload — Squat', 0, 45, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat', 3, '5', '60% of top set',  0),
    (v_wo, 'Goblet Squat',      2, '10', 'Mobility focus',  1),
    (v_wo, 'Leg Curl',          2, '12', 'Light',           2),
    (v_wo, 'Plank',             2, '45s', 'Easy core work', 3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w4, v_prog_str, 'Deload — Bench', 1, 45, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press', 3, '5',  '60% of top set', 0),
    (v_wo, 'Dumbbell Row',       2, '10',  'Light',           1),
    (v_wo, 'Face Pulls',         2, '15',  'Shoulder rehab',  2),
    (v_wo, 'Lateral Raises',     2, '12',  'Easy',            3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w4, v_prog_str, 'Deload — Deadlift', 2, 45, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift', 3, '5',   '60% of top set',    0),
    (v_wo, 'Romanian Deadlift',     2, '8',   'Light, stretch',    1),
    (v_wo, 'Pull-ups',              2, '8',   'Bodyweight only',   2),
    (v_wo, 'Ab Wheel Rollouts',     2, '8',   'Easy',              3);

  -- --------------------------------------------------------
  -- STRENGTH PROTOCOL — Weeks 5-8: Intensity Block + Deload
  -- --------------------------------------------------------

  -- Week 5: Intensity Block 1
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w5, v_prog_str, 'Heavy Squat', 0, 80, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',    5, '3',    'RPE 8, heavier triples', 0),
    (v_wo, 'Pause Squat',           3, '2',    'Heavy pauses',            1),
    (v_wo, 'Bulgarian Split Squat', 3, '6 each', 'Moderate weight',      2),
    (v_wo, 'Leg Curl',              3, '10',   'Controlled',              3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w5, v_prog_str, 'Heavy Bench', 1, 75, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',    5, '3',     'RPE 8',                0),
    (v_wo, 'Close-Grip Bench Press', 3, '5',     'Heavy lockout work',   1),
    (v_wo, 'Overhead Press',         3, '5-6',   'Supplemental',         2),
    (v_wo, 'Barbell Bent-Over Row',  4, '6-8',   'Heavy',                3),
    (v_wo, 'Face Pulls',             3, '15',    'Recovery',             4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w5, v_prog_str, 'Heavy Deadlift', 2, 80, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift', 5, '3',    'RPE 8',                  0),
    (v_wo, 'Deficit Deadlift',      3, '2',    'Off 1-inch platform',    1),
    (v_wo, 'Barbell Row',           4, '6-8',  'Heavy',                  2),
    (v_wo, 'Weighted Pull-ups',     3, '5-6',  'Add weight',             3);

  -- Week 6: Intensity Block 2
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w6, v_prog_str, 'Squat Singles', 0, 80, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat', 3, '1',  'Work up to a heavy single', 0),
    (v_wo, 'Barbell Back Squat', 3, '3',  'Back-off triples at 85%',   1),
    (v_wo, 'Front Squat',       3, '3',   'Moderate',                   2),
    (v_wo, 'Leg Press',         3, '8',   'Volume',                     3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w6, v_prog_str, 'Bench Singles', 1, 75, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',    3, '1',  'Work up to heavy single', 0),
    (v_wo, 'Barbell Bench Press',    3, '3',  'Back-off triples',        1),
    (v_wo, 'Incline Dumbbell Press', 3, '8',  'Moderate',                2),
    (v_wo, 'Cable Row',             4, '8',   'Back balance',            3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w6, v_prog_str, 'Deadlift Singles', 2, 80, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift', 3, '1',  'Work up to heavy single', 0),
    (v_wo, 'Conventional Deadlift', 3, '3',  'Back-off triples',        1),
    (v_wo, 'Romanian Deadlift',     3, '6',  'Moderate',                2),
    (v_wo, 'Pull-ups',              4, '6-8', 'Weighted if possible',   3);

  -- Week 7: Intensity Block 3
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w7, v_prog_str, 'Squat — Overload', 0, 80, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',    6, '2',     'Heavy doubles at RPE 8-9', 0),
    (v_wo, 'Pause Squat',           3, '1',     'Heavy singles',             1),
    (v_wo, 'Leg Press',             3, '8',     'Burnout',                   2),
    (v_wo, 'Standing Calf Raises',  3, '15',    'Accessory',                 3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w7, v_prog_str, 'Bench — Overload', 1, 75, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',    6, '2',     'Heavy doubles', 0),
    (v_wo, 'Close-Grip Bench Press', 3, '3',     'Heavy lockout', 1),
    (v_wo, 'Overhead Press',         3, '3-5',   'Supplemental',  2),
    (v_wo, 'Barbell Bent-Over Row',  4, '5-6',   'Heavy pulls',   3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w7, v_prog_str, 'Deadlift — Overload', 2, 80, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift', 6, '2',     'Heavy doubles at RPE 8-9', 0),
    (v_wo, 'Deficit Deadlift',      3, '1',     'Heavy singles',             1),
    (v_wo, 'Barbell Row',           3, '6-8',   'Moderate',                  2),
    (v_wo, 'Ab Wheel Rollouts',     3, '10',    'Core',                      3);

  -- Week 8: Deload 2
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w8, v_prog_str, 'Deload — All Lifts', 0, 50, 2) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat',    3, '3', '50-60% of max', 0),
    (v_wo, 'Barbell Bench Press',   3, '3', '50-60% of max', 1),
    (v_wo, 'Conventional Deadlift', 3, '3', '50-60% of max', 2),
    (v_wo, 'Pull-ups',              2, '8', 'Bodyweight',     3),
    (v_wo, 'Plank',                 2, '45s', 'Easy',         4);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w8, v_prog_str, 'Light Accessories', 1, 40, 4) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Goblet Squat',    2, '10', 'Mobility',        0),
    (v_wo, 'Push-ups',        2, '15', 'Easy',            1),
    (v_wo, 'Dumbbell Row',    2, '10', 'Light',           2),
    (v_wo, 'Face Pulls',      2, '15', 'Shoulder health', 3);

  -- --------------------------------------------------------
  -- STRENGTH PROTOCOL — Weeks 9-12: Peaking + Test
  -- --------------------------------------------------------

  -- Week 9: Peaking Block 1
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w9, v_prog_str, 'Peak Squat', 0, 80, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat', 5, '2',  'RPE 9 — approach max territory', 0),
    (v_wo, 'Pause Squat',       3, '1',   'Heavy singles',                  1),
    (v_wo, 'Leg Press',         2, '8',   'Light pump work',                2);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w9, v_prog_str, 'Peak Bench', 1, 75, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press',    5, '2',  'RPE 9',             0),
    (v_wo, 'Close-Grip Bench Press', 3, '3',  'Lockout work',      1),
    (v_wo, 'Barbell Bent-Over Row',  3, '6',  'Minimal accessories', 2);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w9, v_prog_str, 'Peak Deadlift', 2, 80, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift', 5, '2',  'RPE 9',              0),
    (v_wo, 'Deficit Deadlift',      2, '1',  'Heavy singles',      1),
    (v_wo, 'Pull-ups',              2, '6',  'Keep it light',      2);

  -- Week 10: Peaking Block 2
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w10, v_prog_str, 'Openers — Squat', 0, 70, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat', 3, '1',  'Practice openers — 90-92%', 0),
    (v_wo, 'Barbell Back Squat', 3, '3',  'Back-off 80%',              1),
    (v_wo, 'Leg Curl',          2, '10',  'Light accessory',           2);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w10, v_prog_str, 'Openers — Bench', 1, 70, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press', 3, '1', 'Practice openers — 90-92%', 0),
    (v_wo, 'Barbell Bench Press', 3, '3', 'Back-off 80%',              1),
    (v_wo, 'Face Pulls',         2, '15', 'Light',                     2);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w10, v_prog_str, 'Openers — Deadlift', 2, 70, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift', 3, '1', 'Practice openers — 90-92%', 0),
    (v_wo, 'Conventional Deadlift', 3, '3', 'Back-off 80%',              1),
    (v_wo, 'Pull-ups',             2, '6',  'Light',                     2);

  -- Week 11: Peaking Block 3 (taper)
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w11, v_prog_str, 'Taper — Squat', 0, 50, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat', 2, '2', '85% — stay sharp, low volume', 0),
    (v_wo, 'Goblet Squat',      2, '8', 'Mobility and blood flow',       1);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w11, v_prog_str, 'Taper — Bench', 1, 50, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press', 2, '2', '85% — minimal volume',  0),
    (v_wo, 'Push-ups',           2, '10', 'Blood flow',            1);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w11, v_prog_str, 'Taper — Deadlift', 2, 50, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift', 2, '2', '85% — stay sharp',    0),
    (v_wo, 'Romanian Deadlift',     2, '5', 'Light hamstring work', 1);

  -- Week 12: Test Week
  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w12, v_prog_str, '1RM Test — Squat', 0, 90, 1) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Back Squat', 1, '1', 'Warm up: bar x 10, 50% x 5, 70% x 3, 80% x 2, 90% x 1', 0),
    (v_wo, 'Barbell Back Squat', 1, '1', '1st attempt: ~92-95%', 1),
    (v_wo, 'Barbell Back Squat', 1, '1', '2nd attempt: ~97-100%', 2),
    (v_wo, 'Barbell Back Squat', 1, '1', '3rd attempt: PR attempt! Go for it!', 3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w12, v_prog_str, '1RM Test — Bench', 1, 90, 3) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Barbell Bench Press', 1, '1', 'Warm up: bar x 10, 50% x 5, 70% x 3, 80% x 2, 90% x 1', 0),
    (v_wo, 'Barbell Bench Press', 1, '1', '1st attempt: ~92-95%', 1),
    (v_wo, 'Barbell Bench Press', 1, '1', '2nd attempt: ~97-100%', 2),
    (v_wo, 'Barbell Bench Press', 1, '1', '3rd attempt: PR attempt!', 3);

  INSERT INTO public.workouts (week_id, program_id, title, order_index, estimated_duration, day_of_week)
  VALUES (v_str_w12, v_prog_str, '1RM Test — Deadlift', 2, 90, 5) RETURNING id INTO v_wo;
  INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
    (v_wo, 'Conventional Deadlift', 1, '1', 'Warm up: bar x 10, 50% x 5, 70% x 3, 80% x 2, 90% x 1', 0),
    (v_wo, 'Conventional Deadlift', 1, '1', '1st attempt: ~92-95%', 1),
    (v_wo, 'Conventional Deadlift', 1, '1', '2nd attempt: ~97-100%', 2),
    (v_wo, 'Conventional Deadlift', 1, '1', '3rd attempt: PR attempt! Leave it all on the platform!', 3);

  -- ==========================================================
  -- 9. ACTIVATE THE USER ON THE FIRST PROGRAM
  -- ==========================================================
  INSERT INTO public.program_activations (user_id, program_id, current_week, is_active)
  VALUES (v_user_id, v_prog_hyper, 1, TRUE)
  ON CONFLICT (user_id, program_id) DO NOTHING;

  -- Deduct a credit for the activation
  INSERT INTO public.credit_ledger (user_id, amount, event_type, reference_id, description)
  VALUES (v_user_id, -1, 'program_activation', v_prog_hyper, 'Activated: Hypertrophy Fundamentals');

  -- ==========================================================
  -- 10. STREAK RECORD
  -- ==========================================================
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_workout_date)
  VALUES (v_user_id, 3, 7, CURRENT_DATE - 1)
  ON CONFLICT (user_id) DO UPDATE SET current_streak = 3, longest_streak = 7, last_workout_date = CURRENT_DATE - 1;

  -- ==========================================================
  -- DONE
  -- ==========================================================
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE 'Programs created: Hypertrophy Fundamentals, Shred 30, Strength Protocol';
  RAISE NOTICE 'User % promoted to admin with creator profile.', v_user_id;

END $$;

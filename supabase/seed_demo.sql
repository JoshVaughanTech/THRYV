-- ============================================================
-- THRYV Demo / Test Data
-- ============================================================
-- Run AFTER seed.sql. Creates:
--   • 4 additional coach profiles with programs
--   • 5 demo user profiles with activity
--   • Workout sessions, momentum, streaks
--   • Feed posts and comments
--   • Follows between users and coaches
--
-- This creates auth users via profiles directly (no auth.users
-- entries) since we can't create auth users from SQL.
-- Demo users are display-only — they can't log in.
-- ============================================================

DO $$
DECLARE
  -- The existing admin/creator from seed.sql
  v_admin_id     UUID;
  v_admin_creator UUID;

  -- Coach user IDs (looked up by email from auth-created profiles)
  v_coach2_uid UUID;
  v_coach3_uid UUID;
  v_coach4_uid UUID;
  v_coach5_uid UUID;

  -- Coach creator IDs
  v_coach2_cid UUID;
  v_coach3_cid UUID;
  v_coach4_cid UUID;
  v_coach5_cid UUID;

  -- Demo user IDs
  v_user1_id UUID;
  v_user2_id UUID;
  v_user3_id UUID;
  v_user4_id UUID;
  v_user5_id UUID;

  -- Program IDs for new coaches
  v_prog_hybrid    UUID;
  v_prog_hiit      UUID;
  v_prog_power     UUID;
  v_prog_foundation UUID;
  v_prog_functional UUID;

  -- Week/workout IDs (reusable)
  v_wk UUID;
  v_wo UUID;

  -- The real signed-up user (your account)
  v_real_user UUID;

BEGIN
  -- Get the admin creator from seed.sql
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  SELECT id INTO v_admin_creator FROM public.creators WHERE user_id = v_admin_id;

  -- Look up demo users by email (created via auth admin API)
  SELECT id INTO v_coach2_uid FROM public.profiles WHERE email = 'sarah.chen@demo.thryv.app';
  SELECT id INTO v_coach3_uid FROM public.profiles WHERE email = 'ali.kapoor@demo.thryv.app';
  SELECT id INTO v_coach4_uid FROM public.profiles WHERE email = 'jake.morrison@demo.thryv.app';
  SELECT id INTO v_coach5_uid FROM public.profiles WHERE email = 'priya.nair@demo.thryv.app';
  SELECT id INTO v_user1_id FROM public.profiles WHERE email = 'jake.reynolds@demo.thryv.app';
  SELECT id INTO v_user2_id FROM public.profiles WHERE email = 'emma.watson@demo.thryv.app';
  SELECT id INTO v_user3_id FROM public.profiles WHERE email = 'marcus.johnson@demo.thryv.app';
  SELECT id INTO v_user4_id FROM public.profiles WHERE email = 'sophia.martinez@demo.thryv.app';
  SELECT id INTO v_user5_id FROM public.profiles WHERE email = 'ryan.park@demo.thryv.app';

  IF v_coach2_uid IS NULL THEN
    RAISE EXCEPTION 'Demo users not found. Run create_demo_users.mjs first.';
  END IF;

  -- The real signed-up user (for activations, follows etc)
  v_real_user := v_admin_id;

  -- ==========================================================
  -- 1. CREATE COACH PROFILES
  -- ==========================================================

  -- Update coach profiles (already created by auth trigger)
  UPDATE public.profiles SET full_name = 'Sarah Chen', role = 'creator', onboarding_completed = TRUE, goals = ARRAY['Lose Fat', 'Athletic Performance'], experience_level = 'advanced', equipment = ARRAY['Full Gym', 'Kettlebells'], time_availability = '30-45 min' WHERE id = v_coach2_uid;
  UPDATE public.profiles SET full_name = 'Ali Kapoor', role = 'creator', onboarding_completed = TRUE, goals = ARRAY['Build Muscle', 'Improve Strength'], experience_level = 'advanced', equipment = ARRAY['Full Gym'], time_availability = '60-90 min' WHERE id = v_coach3_uid;
  UPDATE public.profiles SET full_name = 'Jake Morrison', role = 'creator', onboarding_completed = TRUE, goals = ARRAY['Improve Strength'], experience_level = 'advanced', equipment = ARRAY['Full Gym', 'Barbell'], time_availability = '60-90 min' WHERE id = v_coach4_uid;
  UPDATE public.profiles SET full_name = 'Priya Nair', role = 'creator', onboarding_completed = TRUE, goals = ARRAY['General Fitness', 'Flexibility & Mobility'], experience_level = 'advanced', equipment = ARRAY['Full Gym', 'Resistance Bands'], time_availability = '45-60 min' WHERE id = v_coach5_uid;

  -- Creator records
  INSERT INTO public.creators (user_id, bio, credentials, approved, follower_count, specialties)
  VALUES
    (v_coach2_uid, 'HIIT specialist and former competitive CrossFit athlete. I design conditioning programs that torch fat and build endurance without boring you to death.', 'CrossFit L3, NASM-CPT', TRUE, 8100, ARRAY['HIIT', 'Cardio', 'Conditioning']),
    (v_coach3_uid, 'Elite strength coach with 15 years training professional athletes. My programs are built on proven periodization science.', 'CSCS, USAW-L2, MS Kinesiology', TRUE, 12000, ARRAY['Strength', 'Powerlifting', 'Olympic Lifting']),
    (v_coach4_uid, 'Powerlifting world record holder turned coach. I help everyday lifters build raw strength through smart programming.', 'USAPL Coach, IPF Referee', TRUE, 6300, ARRAY['Powerlifting', 'Strength']),
    (v_coach5_uid, 'Functional fitness expert blending yoga, calisthenics, and strength training. Move better, feel better, perform better.', 'ACE-CPT, RYT-500, FMS-L2', TRUE, 9700, ARRAY['Functional', 'Mobility', 'Calisthenics'])
  ON CONFLICT (user_id) DO UPDATE SET approved = TRUE;

  -- Get the creator IDs
  SELECT id INTO v_coach2_cid FROM public.creators WHERE user_id = v_coach2_uid;
  SELECT id INTO v_coach3_cid FROM public.creators WHERE user_id = v_coach3_uid;
  SELECT id INTO v_coach4_cid FROM public.creators WHERE user_id = v_coach4_uid;
  SELECT id INTO v_coach5_cid FROM public.creators WHERE user_id = v_coach5_uid;

  -- ==========================================================
  -- 2. CREATE DEMO USER PROFILES
  -- ==========================================================

  -- Update demo user profiles (already created by auth trigger)
  UPDATE public.profiles SET full_name = 'Jake Reynolds', onboarding_completed = TRUE, goals = ARRAY['Build Muscle', 'Improve Strength'], experience_level = 'intermediate', equipment = ARRAY['Full Gym'], time_availability = '45-60 min' WHERE id = v_user1_id;
  UPDATE public.profiles SET full_name = 'Emma Watson', onboarding_completed = TRUE, goals = ARRAY['Lose Fat', 'General Fitness'], experience_level = 'beginner', equipment = ARRAY['Dumbbells Only', 'Resistance Bands'], time_availability = '30-45 min' WHERE id = v_user2_id;
  UPDATE public.profiles SET full_name = 'Marcus Johnson', onboarding_completed = TRUE, goals = ARRAY['Build Muscle', 'Athletic Performance'], experience_level = 'advanced', equipment = ARRAY['Full Gym'], time_availability = '60-90 min' WHERE id = v_user3_id;
  UPDATE public.profiles SET full_name = 'Sophia Martinez', onboarding_completed = TRUE, goals = ARRAY['General Fitness', 'Flexibility & Mobility'], experience_level = 'intermediate', equipment = ARRAY['Full Gym', 'Kettlebells'], time_availability = '45-60 min' WHERE id = v_user4_id;
  UPDATE public.profiles SET full_name = 'Ryan Park', onboarding_completed = TRUE, goals = ARRAY['Improve Strength', 'Build Muscle'], experience_level = 'intermediate', equipment = ARRAY['Full Gym'], time_availability = '60-90 min' WHERE id = v_user5_id;

  -- Subscriptions for demo users
  INSERT INTO public.subscriptions (user_id, status, trial_start, trial_end)
  VALUES
    (v_user1_id, 'active', NOW() - INTERVAL '60 days', NOW() - INTERVAL '46 days'),
    (v_user2_id, 'trial', NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days'),
    (v_user3_id, 'active', NOW() - INTERVAL '120 days', NOW() - INTERVAL '106 days'),
    (v_user4_id, 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '16 days'),
    (v_user5_id, 'trial', NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days')
  ON CONFLICT (user_id) DO NOTHING;

  -- Credits for demo users
  INSERT INTO public.credit_ledger (user_id, amount, event_type, description) VALUES
    (v_user1_id, 5, 'monthly_grant', 'Monthly allocation'),
    (v_user1_id, -2, 'program_activation', 'Activated Hybrid Power'),
    (v_user1_id, -1, 'program_activation', 'Activated HIIT Ignite'),
    (v_user2_id, 3, 'trial_grant', 'Free trial credits'),
    (v_user3_id, 5, 'monthly_grant', 'Monthly allocation'),
    (v_user3_id, -2, 'program_activation', 'Activated Strength Protocol'),
    (v_user4_id, 5, 'monthly_grant', 'Monthly allocation'),
    (v_user4_id, -1, 'program_activation', 'Activated Foundation'),
    (v_user5_id, 3, 'trial_grant', 'Free trial credits'),
    (v_user5_id, -1, 'program_activation', 'Activated Foundation');

  -- Streaks
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_workout_date) VALUES
    (v_user1_id, 12, 28, CURRENT_DATE),
    (v_user2_id, 3, 3, CURRENT_DATE),
    (v_user3_id, 45, 45, CURRENT_DATE),
    (v_user4_id, 7, 14, CURRENT_DATE - 1),
    (v_user5_id, 5, 5, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  -- ==========================================================
  -- 3. CREATE PROGRAMS FOR NEW COACHES
  -- ==========================================================

  -- Sarah Chen: HIIT Ignite
  INSERT INTO public.programs (creator_id, title, description, goal, discipline, experience_level, equipment, duration_weeks, credit_cost, status)
  VALUES (v_coach2_cid, 'HIIT Ignite', 'An intense 8-week HIIT program designed to melt fat and build conditioning. Short sessions, maximum effort, real results.', 'Lose Fat', 'HIIT', 'All levels', ARRAY['Kettlebells', 'Bodyweight', 'Jump Rope'], 8, 1, 'published')
  RETURNING id INTO v_prog_hiit;

  -- Ali Kapoor: Foundation
  INSERT INTO public.programs (creator_id, title, description, goal, discipline, experience_level, equipment, duration_weeks, credit_cost, status)
  VALUES (v_coach3_cid, 'Foundation', 'The perfect 6-week beginner program. Learn proper form, build a base of strength, and develop the habits that will carry you for years.', 'General Fitness', 'Full Body', 'Beginner', ARRAY['Barbell', 'Dumbbells', 'Cable Machine'], 6, 1, 'published')
  RETURNING id INTO v_prog_foundation;

  -- Jake Morrison: Power Surge
  INSERT INTO public.programs (creator_id, title, description, goal, discipline, experience_level, equipment, duration_weeks, credit_cost, status)
  VALUES (v_coach4_cid, 'Power Surge', 'A 12-week powerlifting program focused on the big three. Progressive overload with intelligent deloads. Prepare to PR.', 'Improve Strength', 'Powerlifting', 'Intermediate', ARRAY['Barbell', 'Power Rack', 'Bench'], 12, 2, 'published')
  RETURNING id INTO v_prog_power;

  -- Priya Nair: Move Well
  INSERT INTO public.programs (creator_id, title, description, goal, discipline, experience_level, equipment, duration_weeks, credit_cost, status)
  VALUES (v_coach5_cid, 'Move Well', 'A 6-week functional movement program combining strength, mobility, and conditioning. Build a body that performs as good as it looks.', 'General Fitness', 'Functional', 'All levels', ARRAY['Kettlebells', 'Resistance Bands', 'Bodyweight'], 6, 1, 'published')
  RETURNING id INTO v_prog_functional;

  -- Sarah Chen: Tabata Torch
  INSERT INTO public.programs (creator_id, title, description, goal, discipline, experience_level, equipment, duration_weeks, credit_cost, status)
  VALUES (v_coach2_cid, 'Tabata Torch', '4 weeks of pure Tabata-style conditioning. 20 seconds on, 10 seconds off. Simple, brutal, effective.', 'Lose Fat', 'HIIT', 'Intermediate', ARRAY['Bodyweight', 'Dumbbells'], 4, 1, 'published');

  -- Ali Kapoor: Elite Strength
  INSERT INTO public.programs (creator_id, title, description, goal, discipline, experience_level, equipment, duration_weeks, credit_cost, status)
  VALUES (v_coach3_cid, 'Elite Strength', 'Advanced 10-week periodized strength program for experienced lifters ready to push past plateaus.', 'Improve Strength', 'Strength', 'Advanced', ARRAY['Full Gym'], 10, 2, 'published');

  -- Also get the Hypertrophy program from seed.sql for activations
  SELECT id INTO v_prog_hybrid FROM public.programs WHERE title = 'Hypertrophy Fundamentals' LIMIT 1;
  IF v_prog_hybrid IS NULL THEN
    SELECT id INTO v_prog_hybrid FROM public.programs WHERE creator_id = v_admin_creator LIMIT 1;
  END IF;

  -- ==========================================================
  -- 4. ADD WEEKS + WORKOUTS + EXERCISES TO NEW PROGRAMS
  -- ==========================================================

  -- HIIT Ignite — 8 weeks, 4 workouts per week
  FOR i IN 1..8 LOOP
    INSERT INTO public.program_weeks (program_id, week_number, title)
    VALUES (v_prog_hiit, i, 'Week ' || i)
    RETURNING id INTO v_wk;

    -- Workout 1: Upper body HIIT
    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_hiit, 'Upper body HIIT', 'High intensity upper body circuit', 1, 0, 30)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Push-up variations', 4, '12', 'Alternate wide/narrow each set', 0),
      (v_wo, 'Kettlebell swings', 4, '15', NULL, 1),
      (v_wo, 'Renegade rows', 3, '10', 'Each side', 2),
      (v_wo, 'Burpees', 3, '10', 'Full burpee with push-up', 3),
      (v_wo, 'Plank to push-up', 3, '12', NULL, 4);

    -- Workout 2: Lower body HIIT
    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_hiit, 'Lower body HIIT', 'Leg-focused conditioning blast', 3, 1, 30)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Jump squats', 4, '15', NULL, 0),
      (v_wo, 'Kettlebell goblet squats', 4, '12', NULL, 1),
      (v_wo, 'Walking lunges', 3, '20', '10 each leg', 2),
      (v_wo, 'Box jumps', 3, '10', NULL, 3),
      (v_wo, 'Wall sit', 3, '45s', 'Hold for 45 seconds', 4);

    -- Workout 3: Full body circuit
    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_hiit, 'Full body circuit', 'Total body conditioning', 5, 2, 25)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Thrusters', 4, '10', NULL, 0),
      (v_wo, 'Mountain climbers', 4, '20', NULL, 1),
      (v_wo, 'Devil press', 3, '8', NULL, 2),
      (v_wo, 'Broad jumps', 3, '8', NULL, 3);

    -- Workout 4: Tabata finisher
    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_hiit, 'Tabata finisher', '20/10 Tabata intervals', 6, 3, 20)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Assault bike sprints', 8, '20s', '20 on / 10 off', 0),
      (v_wo, 'Battle ropes', 8, '20s', '20 on / 10 off', 1),
      (v_wo, 'Jump rope', 8, '20s', '20 on / 10 off', 2);
  END LOOP;

  -- Foundation — 6 weeks, 3 workouts per week
  FOR i IN 1..6 LOOP
    INSERT INTO public.program_weeks (program_id, week_number, title)
    VALUES (v_prog_foundation, i, 'Week ' || i)
    RETURNING id INTO v_wk;

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_foundation, 'Full body A', 'Squat + press focus', 1, 0, 45)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Barbell back squat', 4, '8', 'Focus on depth and control', 0),
      (v_wo, 'Overhead press', 3, '8', NULL, 1),
      (v_wo, 'Dumbbell rows', 3, '10', 'Each arm', 2),
      (v_wo, 'Leg press', 3, '12', NULL, 3),
      (v_wo, 'Plank holds', 3, '30s', NULL, 4);

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_foundation, 'Full body B', 'Deadlift + pull focus', 3, 1, 45)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Conventional deadlift', 4, '6', 'Controlled eccentric', 0),
      (v_wo, 'Lat pulldowns', 3, '10', NULL, 1),
      (v_wo, 'Dumbbell bench press', 3, '10', NULL, 2),
      (v_wo, 'Romanian deadlift', 3, '10', NULL, 3),
      (v_wo, 'Cable face pulls', 3, '15', NULL, 4);

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_foundation, 'Full body C', 'Accessories and conditioning', 5, 2, 40)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Goblet squats', 3, '12', NULL, 0),
      (v_wo, 'Incline dumbbell press', 3, '10', NULL, 1),
      (v_wo, 'Cable rows', 3, '12', NULL, 2),
      (v_wo, 'Farmer carries', 3, '40m', NULL, 3),
      (v_wo, 'Ab wheel rollouts', 3, '10', NULL, 4);
  END LOOP;

  -- Power Surge — 12 weeks, 4 workouts per week
  FOR i IN 1..12 LOOP
    INSERT INTO public.program_weeks (program_id, week_number, title)
    VALUES (v_prog_power, i, CASE
      WHEN i <= 4 THEN 'Accumulation ' || i
      WHEN i <= 8 THEN 'Intensification ' || (i - 4)
      WHEN i <= 11 THEN 'Peaking ' || (i - 8)
      ELSE 'Deload / Test'
    END)
    RETURNING id INTO v_wk;

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_power, 'Squat day', 'Squat-focused session', 1, 0, 60)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Barbell back squat', 5, CASE WHEN i <= 4 THEN '5' WHEN i <= 8 THEN '3' ELSE '2' END, 'Main lift — RPE ' || CASE WHEN i <= 4 THEN '7' WHEN i <= 8 THEN '8' ELSE '9' END, 0),
      (v_wo, 'Front squat', 3, '6', 'Supplemental', 1),
      (v_wo, 'Leg press', 3, '10', NULL, 2),
      (v_wo, 'Bulgarian split squat', 3, '8', 'Each leg', 3);

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_power, 'Bench day', 'Bench press focus', 2, 1, 55)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Barbell bench press', 5, CASE WHEN i <= 4 THEN '5' WHEN i <= 8 THEN '3' ELSE '2' END, 'Main lift', 0),
      (v_wo, 'Close-grip bench press', 3, '8', NULL, 1),
      (v_wo, 'Incline dumbbell press', 3, '10', NULL, 2),
      (v_wo, 'Tricep dips', 3, '12', NULL, 3);

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_power, 'Deadlift day', 'Deadlift focus', 4, 2, 60)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Conventional deadlift', 5, CASE WHEN i <= 4 THEN '5' WHEN i <= 8 THEN '3' ELSE '2' END, 'Main lift', 0),
      (v_wo, 'Barbell rows', 4, '8', NULL, 1),
      (v_wo, 'Romanian deadlift', 3, '8', NULL, 2),
      (v_wo, 'Pull-ups', 3, 'AMRAP', NULL, 3);

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_power, 'Overhead day', 'OHP and accessories', 5, 3, 50)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Standing overhead press', 4, '5', 'Main lift', 0),
      (v_wo, 'Lateral raises', 3, '15', NULL, 1),
      (v_wo, 'Face pulls', 3, '15', NULL, 2),
      (v_wo, 'Barbell curls', 3, '10', NULL, 3);
  END LOOP;

  -- Move Well — 6 weeks, 4 workouts per week
  FOR i IN 1..6 LOOP
    INSERT INTO public.program_weeks (program_id, week_number, title)
    VALUES (v_prog_functional, i, 'Week ' || i)
    RETURNING id INTO v_wk;

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_functional, 'Strength & stability', NULL, 1, 0, 40)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Turkish get-up', 3, '3', 'Each side, slow and controlled', 0),
      (v_wo, 'Kettlebell goblet squat', 3, '10', NULL, 1),
      (v_wo, 'Single-leg deadlift', 3, '8', 'Each side', 2),
      (v_wo, 'Pallof press', 3, '10', 'Each side', 3);

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_functional, 'Mobility flow', NULL, 3, 1, 30)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'World''s greatest stretch', 3, '5', 'Each side', 0),
      (v_wo, '90/90 hip switches', 3, '8', NULL, 1),
      (v_wo, 'Cat-cow flow', 3, '10', NULL, 2),
      (v_wo, 'Deep squat hold', 3, '30s', NULL, 3);

    INSERT INTO public.workouts (week_id, program_id, title, description, day_of_week, order_index, estimated_duration)
    VALUES (v_wk, v_prog_functional, 'Conditioning circuit', NULL, 5, 2, 35)
    RETURNING id INTO v_wo;
    INSERT INTO public.exercises (workout_id, name, sets, reps, notes, order_index) VALUES
      (v_wo, 'Kettlebell clean & press', 4, '8', 'Each arm', 0),
      (v_wo, 'Bear crawl', 3, '20m', NULL, 1),
      (v_wo, 'Medicine ball slams', 3, '10', NULL, 2),
      (v_wo, 'Sled push', 3, '30m', NULL, 3);
  END LOOP;

  -- ==========================================================
  -- 5. PROGRAM ACTIVATIONS FOR DEMO USERS
  -- ==========================================================

  INSERT INTO public.program_activations (user_id, program_id, current_week, is_active, activated_at) VALUES
    (v_user1_id, v_prog_hiit,       4, TRUE, NOW() - INTERVAL '28 days'),
    (v_user1_id, v_prog_power,      4, TRUE, NOW() - INTERVAL '28 days'),
    (v_user2_id, v_prog_foundation, 1, TRUE, NOW() - INTERVAL '3 days'),
    (v_user3_id, v_prog_power,      8, TRUE, NOW() - INTERVAL '56 days'),
    (v_user4_id, v_prog_functional, 3, TRUE, NOW() - INTERVAL '14 days'),
    (v_user5_id, v_prog_foundation, 2, TRUE, NOW() - INTERVAL '7 days')
  ON CONFLICT (user_id, program_id) DO NOTHING;

  -- Activate programs for real user too
  IF v_prog_hiit IS NOT NULL THEN
    INSERT INTO public.program_activations (user_id, program_id, current_week, is_active, activated_at)
    VALUES (v_real_user, v_prog_hiit, 4, TRUE, NOW() - INTERVAL '28 days')
    ON CONFLICT (user_id, program_id) DO NOTHING;
  END IF;
  IF v_prog_foundation IS NOT NULL THEN
    INSERT INTO public.program_activations (user_id, program_id, current_week, is_active, activated_at)
    VALUES (v_real_user, v_prog_foundation, 2, TRUE, NOW() - INTERVAL '10 days')
    ON CONFLICT (user_id, program_id) DO NOTHING;
  END IF;

  -- ==========================================================
  -- 6. WORKOUT SESSIONS (simulate recent activity)
  -- ==========================================================

  -- Jake Reynolds: lots of sessions
  INSERT INTO public.workout_sessions (user_id, workout_id, program_id, completed_at, duration_seconds)
  SELECT v_user1_id, w.id, w.program_id, NOW() - (INTERVAL '1 day' * gs.n), (35 + (random() * 25))::int * 60
  FROM public.workouts w
  CROSS JOIN generate_series(1, 14) AS gs(n)
  WHERE w.program_id IN (v_prog_hiit, v_prog_power)
  AND w.order_index < 3
  LIMIT 20
  ON CONFLICT DO NOTHING;

  -- Marcus Johnson: heavy user
  INSERT INTO public.workout_sessions (user_id, workout_id, program_id, completed_at, duration_seconds)
  SELECT v_user3_id, w.id, w.program_id, NOW() - (INTERVAL '1 day' * gs.n), (45 + (random() * 20))::int * 60
  FROM public.workouts w
  CROSS JOIN generate_series(1, 21) AS gs(n)
  WHERE w.program_id = v_prog_power
  AND w.order_index < 4
  LIMIT 30
  ON CONFLICT DO NOTHING;

  -- ==========================================================
  -- 7. MOMENTUM EVENTS
  -- ==========================================================

  INSERT INTO public.momentum_events (user_id, event_type, points, created_at) VALUES
    (v_user1_id, 'workout_completion', 10, NOW() - INTERVAL '1 day'),
    (v_user1_id, 'workout_completion', 10, NOW() - INTERVAL '2 days'),
    (v_user1_id, 'workout_completion', 10, NOW() - INTERVAL '3 days'),
    (v_user1_id, 'streak_bonus', 25, NOW() - INTERVAL '5 days'),
    (v_user1_id, 'workout_completion', 10, NOW() - INTERVAL '4 days'),
    (v_user1_id, 'workout_completion', 10, NOW() - INTERVAL '5 days'),
    (v_user1_id, 'workout_completion', 10, NOW() - INTERVAL '6 days'),
    (v_user1_id, 'workout_completion', 10, NOW() - INTERVAL '7 days'),
    (v_user3_id, 'workout_completion', 10, NOW() - INTERVAL '1 day'),
    (v_user3_id, 'workout_completion', 10, NOW() - INTERVAL '2 days'),
    (v_user3_id, 'workout_completion', 10, NOW() - INTERVAL '3 days'),
    (v_user3_id, 'streak_bonus', 25, NOW() - INTERVAL '7 days'),
    (v_user3_id, 'streak_bonus', 25, NOW() - INTERVAL '14 days'),
    (v_user3_id, 'streak_bonus', 25, NOW() - INTERVAL '21 days'),
    (v_user4_id, 'workout_completion', 10, NOW() - INTERVAL '1 day'),
    (v_user4_id, 'workout_completion', 10, NOW() - INTERVAL '2 days'),
    (v_user4_id, 'streak_bonus', 25, NOW() - INTERVAL '7 days'),
    (v_user5_id, 'workout_completion', 10, NOW() - INTERVAL '1 day'),
    (v_user5_id, 'workout_completion', 10, NOW() - INTERVAL '2 days'),
    (v_real_user, 'workout_completion', 10, NOW() - INTERVAL '1 day'),
    (v_real_user, 'workout_completion', 10, NOW() - INTERVAL '2 days'),
    (v_real_user, 'workout_completion', 10, NOW() - INTERVAL '3 days'),
    (v_real_user, 'streak_bonus', 25, NOW() - INTERVAL '7 days');

  -- ==========================================================
  -- 8. FOLLOWS
  -- ==========================================================

  -- Demo users follow coaches
  INSERT INTO public.follows (follower_id, following_id) VALUES
    (v_user1_id, v_coach2_uid),
    (v_user1_id, v_coach3_uid),
    (v_user1_id, v_coach4_uid),
    (v_user2_id, v_coach3_uid),
    (v_user2_id, v_coach5_uid),
    (v_user3_id, v_coach3_uid),
    (v_user3_id, v_coach4_uid),
    (v_user3_id, v_admin_id),
    (v_user4_id, v_coach5_uid),
    (v_user4_id, v_coach2_uid),
    (v_user5_id, v_coach3_uid),
    (v_user5_id, v_coach4_uid),
    -- Users follow each other
    (v_user1_id, v_user3_id),
    (v_user3_id, v_user1_id),
    (v_user1_id, v_user5_id),
    (v_user4_id, v_user2_id),
    -- Real user follows coaches and some users
    (v_real_user, v_coach2_uid),
    (v_real_user, v_coach3_uid),
    (v_real_user, v_coach4_uid),
    (v_real_user, v_coach5_uid),
    (v_real_user, v_user1_id),
    (v_real_user, v_user3_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  -- ==========================================================
  -- 9. FEED POSTS
  -- ==========================================================

  -- Coach posts (tied to their programs)
  INSERT INTO public.posts (user_id, program_id, content, created_at) VALUES
    (v_coach2_uid, v_prog_hiit, 'Week 4 is where it gets real. If you''ve been consistent, your conditioning is about to hit a new level. Push through — it separates the committed from the casual.', NOW() - INTERVAL '2 hours'),
    (v_coach2_uid, v_prog_hiit, 'New conditioning circuit dropping next week. 20 min. No rest. You''re not ready.', NOW() - INTERVAL '1 day'),
    (v_coach3_uid, v_prog_foundation, 'Reminder: technique first, weight second. I''d rather you squat 135lb with perfect form than 225lb with your back looking like a question mark.', NOW() - INTERVAL '4 hours'),
    (v_coach4_uid, v_prog_power, 'Peaking phase starts week 9. If you''ve been putting in the work, this is where it pays off. Trust the process.', NOW() - INTERVAL '6 hours'),
    (v_coach5_uid, v_prog_functional, 'Your body doesn''t care how much you bench. It cares about how well you move. Mobility is not optional.', NOW() - INTERVAL '8 hours'),
    (v_coach3_uid, v_prog_foundation, 'Huge shoutout to everyone completing their first month of Foundation. The consistency you''re building matters more than any single workout.', NOW() - INTERVAL '2 days'),
    (v_admin_id, (SELECT id FROM public.programs WHERE creator_id = v_admin_creator LIMIT 1), 'Volume is the driver of hypertrophy. If you''re not tracking your sets and reps, you''re leaving gains on the table.', NOW() - INTERVAL '3 hours');

  -- User posts (tied to programs they''re in)
  INSERT INTO public.posts (user_id, program_id, content, created_at) VALUES
    (v_user1_id, v_prog_power, 'Deadlift PR today! 205lb for a clean triple. This program is actually unreal. Week 4 hitting different.', NOW() - INTERVAL '45 minutes'),
    (v_user1_id, v_prog_hiit, 'Those Tabata finishers are no joke. I was on the floor for 10 minutes after Saturday''s session. Love it.', NOW() - INTERVAL '1 day'),
    (v_user3_id, v_prog_power, 'Squat day is best day. Hit 315 for a double today. Power Surge is the best program I''ve ever run.', NOW() - INTERVAL '3 hours'),
    (v_user3_id, v_prog_power, 'Week 8 check-in: Every lift is moving in the right direction. Sleep and nutrition on point. Let''s go.', NOW() - INTERVAL '2 days'),
    (v_user4_id, v_prog_functional, 'The Turkish get-ups looked easy on video. They were NOT easy. My core is destroyed in the best way.', NOW() - INTERVAL '5 hours'),
    (v_user5_id, v_prog_foundation, 'Week 2 done. I''m sore in muscles I didn''t know existed. Loving every second of it though. This community keeps me going.', NOW() - INTERVAL '6 hours'),
    (v_user2_id, v_prog_foundation, 'Day 3 of Foundation. First time doing barbell squats and I''m hooked. Can''t believe I waited this long to start lifting.', NOW() - INTERVAL '1 day');

  -- ==========================================================
  -- 10. COMMENTS
  -- ==========================================================

  -- Comments on posts (use subqueries to get post IDs)
  INSERT INTO public.comments (post_id, user_id, content, created_at)
  SELECT p.id, v_user1_id, 'This is exactly what I needed to hear. Week 4 let''s go!', p.created_at + INTERVAL '30 minutes'
  FROM public.posts p WHERE p.user_id = v_coach2_uid AND p.content LIKE 'Week 4%' LIMIT 1;

  INSERT INTO public.comments (post_id, user_id, content, created_at)
  SELECT p.id, v_user3_id, 'Beast mode! That deadlift is moving fast.', p.created_at + INTERVAL '15 minutes'
  FROM public.posts p WHERE p.user_id = v_user1_id AND p.content LIKE 'Deadlift PR%' LIMIT 1;

  INSERT INTO public.comments (post_id, user_id, content, created_at)
  SELECT p.id, v_coach4_uid, 'Strong pull! Keep that bar path tight and you''ll hit 225 in no time.', p.created_at + INTERVAL '1 hour'
  FROM public.posts p WHERE p.user_id = v_user1_id AND p.content LIKE 'Deadlift PR%' LIMIT 1;

  INSERT INTO public.comments (post_id, user_id, content, created_at)
  SELECT p.id, v_user1_id, '315 squat is goals. How long have you been lifting?', p.created_at + INTERVAL '20 minutes'
  FROM public.posts p WHERE p.user_id = v_user3_id AND p.content LIKE 'Squat day%' LIMIT 1;

  INSERT INTO public.comments (post_id, user_id, content, created_at)
  SELECT p.id, v_user4_id, 'Welcome to the squad! It only gets better from here.', p.created_at + INTERVAL '2 hours'
  FROM public.posts p WHERE p.user_id = v_user2_id AND p.content LIKE 'Day 3%' LIMIT 1;

  INSERT INTO public.comments (post_id, user_id, content, created_at)
  SELECT p.id, v_coach5_uid, 'Love this energy! The TGUs will get easier. Or you''ll get tougher. Either way, you win.', p.created_at + INTERVAL '1 hour'
  FROM public.posts p WHERE p.user_id = v_user4_id AND p.content LIKE '%Turkish%' LIMIT 1;

  -- ==========================================================
  -- DONE
  -- ==========================================================
  RAISE NOTICE 'Demo data seeded successfully!';
  RAISE NOTICE 'Coaches: Sarah Chen, Ali Kapoor, Jake Morrison, Priya Nair';
  RAISE NOTICE 'Users: Jake Reynolds, Emma Watson, Marcus Johnson, Sophia Martinez, Ryan Park';
  RAISE NOTICE 'Programs: HIIT Ignite, Foundation, Power Surge, Move Well, Tabata Torch, Elite Strength';

END $$;

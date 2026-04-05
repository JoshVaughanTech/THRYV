-- THRYV MVP — Row Level Security Policies
-- Run after initial schema migration

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momentum_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_results ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if user is a creator
CREATE OR REPLACE FUNCTION public.is_creator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND approved = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: get creator id for current user
CREATE OR REPLACE FUNCTION public.get_creator_id()
RETURNS UUID AS $$
  SELECT id FROM public.creators WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can view any profile"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- CREATORS
-- ============================================================
CREATE POLICY "Anyone can view approved creators"
  ON public.creators FOR SELECT
  USING (approved = TRUE OR user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can apply to become a creator"
  ON public.creators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can update their own profile"
  ON public.creators FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "System can insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "System can update subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- CREDIT LEDGER
-- ============================================================
CREATE POLICY "Users can view their own credits"
  ON public.credit_ledger FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "System can insert credit events"
  ON public.credit_ledger FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- PROGRAMS
-- ============================================================
CREATE POLICY "Anyone can view published programs"
  ON public.programs FOR SELECT
  USING (status = 'published' OR creator_id = public.get_creator_id() OR public.is_admin());

CREATE POLICY "Creators can insert programs"
  ON public.programs FOR INSERT
  WITH CHECK (creator_id = public.get_creator_id() OR public.is_admin());

CREATE POLICY "Creators can update their own programs"
  ON public.programs FOR UPDATE
  USING (creator_id = public.get_creator_id() OR public.is_admin());

CREATE POLICY "Creators can delete their draft programs"
  ON public.programs FOR DELETE
  USING ((creator_id = public.get_creator_id() AND status = 'draft') OR public.is_admin());

-- ============================================================
-- PROGRAM WEEKS
-- ============================================================
CREATE POLICY "Anyone can view weeks of visible programs"
  ON public.program_weeks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = program_id
    AND (p.status = 'published' OR p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

CREATE POLICY "Creators can manage weeks"
  ON public.program_weeks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = program_id AND (p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

CREATE POLICY "Creators can update weeks"
  ON public.program_weeks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = program_id AND (p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

CREATE POLICY "Creators can delete weeks"
  ON public.program_weeks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = program_id AND (p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

-- ============================================================
-- WORKOUTS
-- ============================================================
CREATE POLICY "Anyone can view workouts of visible programs"
  ON public.workouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = program_id
    AND (p.status = 'published' OR p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

CREATE POLICY "Creators can manage workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = program_id AND (p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

CREATE POLICY "Creators can update workouts"
  ON public.workouts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = program_id AND (p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

CREATE POLICY "Creators can delete workouts"
  ON public.workouts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = program_id AND (p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

-- ============================================================
-- EXERCISES
-- ============================================================
CREATE POLICY "Anyone can view exercises of visible workouts"
  ON public.exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workouts w
    JOIN public.programs p ON p.id = w.program_id
    WHERE w.id = workout_id
    AND (p.status = 'published' OR p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

CREATE POLICY "Creators can manage exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workouts w
    JOIN public.programs p ON p.id = w.program_id
    WHERE w.id = workout_id AND (p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

CREATE POLICY "Creators can update exercises"
  ON public.exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workouts w
    JOIN public.programs p ON p.id = w.program_id
    WHERE w.id = workout_id AND (p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

CREATE POLICY "Creators can delete exercises"
  ON public.exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workouts w
    JOIN public.programs p ON p.id = w.program_id
    WHERE w.id = workout_id AND (p.creator_id = public.get_creator_id() OR public.is_admin())
  ));

-- ============================================================
-- PROGRAM ACTIVATIONS
-- ============================================================
CREATE POLICY "Users can view their own activations"
  ON public.program_activations FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can activate programs"
  ON public.program_activations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own activations"
  ON public.program_activations FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- WORKOUT SESSIONS
-- ============================================================
CREATE POLICY "Users can view their own sessions"
  ON public.workout_sessions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can log workout sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- MOMENTUM EVENTS
-- ============================================================
CREATE POLICY "Users can view their own momentum"
  ON public.momentum_events FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "System can insert momentum events"
  ON public.momentum_events FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- STREAKS
-- ============================================================
CREATE POLICY "Users can view their own streaks"
  ON public.streaks FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can manage their own streaks"
  ON public.streaks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own streaks"
  ON public.streaks FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- POSTS
-- ============================================================
CREATE POLICY "Users with active program can view posts"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.program_activations pa
      WHERE pa.program_id = posts.program_id AND pa.user_id = auth.uid() AND pa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = posts.program_id AND p.creator_id = public.get_creator_id()
    )
    OR public.is_admin()
  );

CREATE POLICY "Users with active program can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.program_activations pa
        WHERE pa.program_id = posts.program_id AND pa.user_id = auth.uid() AND pa.is_active = TRUE
      )
      OR EXISTS (
        SELECT 1 FROM public.programs p
        WHERE p.id = posts.program_id AND p.creator_id = public.get_creator_id()
      )
    )
  );

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE POLICY "Users can view comments on visible posts"
  ON public.comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = post_id
  ));

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- USAGE EVENTS
-- ============================================================
CREATE POLICY "Users can view their own usage"
  ON public.usage_events FOR SELECT
  USING (user_id = auth.uid() OR creator_id = public.get_creator_id() OR public.is_admin());

CREATE POLICY "System can insert usage events"
  ON public.usage_events FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- PAYOUT RUNS & RESULTS
-- ============================================================
CREATE POLICY "Admins can manage payout runs"
  ON public.payout_runs FOR ALL
  USING (public.is_admin());

CREATE POLICY "Creators can view their own payout results"
  ON public.payout_results FOR SELECT
  USING (creator_id = public.get_creator_id() OR public.is_admin());

CREATE POLICY "Admins can manage payout results"
  ON public.payout_results FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update payout results"
  ON public.payout_results FOR UPDATE
  USING (public.is_admin());

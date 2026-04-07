-- ============================================================
-- THRYV — Notifications, Workout History, Social Features
-- ============================================================

-- ============================================================
-- 1. NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'workout_complete', 'streak_milestone', 'level_up', 'program_activated',
    'credit_received', 'payout_locked', 'new_follower', 'community_reply',
    'community_like', 'program_published', 'creator_approved'
  )),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- 2. SET LOGS (per-set tracking for workout history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight NUMERIC,
  reps INTEGER,
  rpe NUMERIC,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_set_logs_session ON public.set_logs(session_id);
CREATE INDEX idx_set_logs_exercise ON public.set_logs(exercise_id);

ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own set logs"
  ON public.set_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = session_id AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own set logs"
  ON public.set_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = session_id AND ws.user_id = auth.uid()
  ));

-- ============================================================
-- 3. PERSONAL RECORDS
-- ============================================================
CREATE TABLE public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL DEFAULT 1,
  estimated_1rm NUMERIC,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pr_user ON public.personal_records(user_id);
CREATE INDEX idx_pr_exercise ON public.personal_records(user_id, exercise_name);

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PRs"
  ON public.personal_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own PRs"
  ON public.personal_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own PRs"
  ON public.personal_records FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- 4. FOLLOWS (users follow creators)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, creator_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_creator ON public.follows(creator_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can follow creators"
  ON public.follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow creators"
  ON public.follows FOR DELETE
  USING (follower_id = auth.uid());

-- ============================================================
-- 5. POST LIKES
-- ============================================================
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_likes_post ON public.post_likes(post_id);
CREATE INDEX idx_likes_user ON public.post_likes(user_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.post_likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 6. UPDATE CREATORS TABLE — add follower_count trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creators SET follower_count = follower_count + 1 WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creators SET follower_count = follower_count - 1 WHERE id = OLD.creator_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER follows_update_count
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follower_count();

-- ============================================================
-- 7. HELPER: Estimated 1RM (Epley formula)
-- ============================================================
CREATE OR REPLACE FUNCTION public.estimated_1rm(weight NUMERIC, reps INTEGER)
RETURNS NUMERIC AS $$
  SELECT CASE
    WHEN reps = 1 THEN weight
    WHEN reps > 0 THEN ROUND(weight * (1 + reps / 30.0), 1)
    ELSE 0
  END;
$$ LANGUAGE sql IMMUTABLE;

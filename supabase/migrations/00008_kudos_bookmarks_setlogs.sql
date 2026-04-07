-- Kudos (likes on posts)
CREATE TABLE public.kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_kudos_post ON public.kudos(post_id);
CREATE INDEX idx_kudos_user ON public.kudos(user_id);

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see kudos" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Users manage own kudos" ON public.kudos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own kudos" ON public.kudos FOR DELETE USING (user_id = auth.uid());

-- Add kudos_count to posts for fast reads
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS kudos_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

-- Auto-update kudos count
CREATE OR REPLACE FUNCTION update_kudos_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET kudos_count = kudos_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET kudos_count = GREATEST(kudos_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_kudos_change
  AFTER INSERT OR DELETE ON public.kudos
  FOR EACH ROW EXECUTE FUNCTION update_kudos_count();

-- Auto-update comment count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_count_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Backfill existing counts
UPDATE public.posts SET kudos_count = (SELECT COUNT(*) FROM public.kudos WHERE post_id = posts.id);
UPDATE public.posts SET comment_count = (SELECT COUNT(*) FROM public.comments WHERE post_id = posts.id);

-- Bookmarks (saved posts)
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Exercise set logs (per-set weight/reps/rpe data)
CREATE TABLE public.set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight NUMERIC,
  reps INTEGER,
  rpe NUMERIC,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_set_logs_session ON public.set_logs(session_id);
CREATE INDEX idx_set_logs_exercise ON public.set_logs(exercise_id);

ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own set logs" ON public.set_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = set_logs.session_id AND ws.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = set_logs.session_id AND ws.user_id = auth.uid()));

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('kudos', 'comment', 'follow', 'program_update', 'streak', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  reference_id UUID,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Auto-create notifications on kudos
CREATE OR REPLACE FUNCTION notify_on_kudos()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author UUID;
  v_kudos_user TEXT;
BEGIN
  SELECT user_id INTO v_post_author FROM public.posts WHERE id = NEW.post_id;
  IF v_post_author = NEW.user_id THEN RETURN NEW; END IF; -- Don't notify self
  SELECT full_name INTO v_kudos_user FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (v_post_author, 'kudos', COALESCE(v_kudos_user, 'Someone') || ' gave your post kudos', NULL, NEW.post_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_kudos_notify
  AFTER INSERT ON public.kudos
  FOR EACH ROW EXECUTE FUNCTION notify_on_kudos();

-- Auto-create notifications on comments
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author UUID;
  v_commenter TEXT;
BEGIN
  SELECT user_id INTO v_post_author FROM public.posts WHERE id = NEW.post_id;
  IF v_post_author = NEW.user_id THEN RETURN NEW; END IF;
  SELECT full_name INTO v_commenter FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (v_post_author, 'comment', COALESCE(v_commenter, 'Someone') || ' commented on your post', NEW.content, NEW.post_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Auto-create notifications on follows
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  v_follower TEXT;
BEGIN
  SELECT full_name INTO v_follower FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, type, title, reference_id)
  VALUES (NEW.following_id, 'follow', COALESCE(v_follower, 'Someone') || ' started following you', NEW.follower_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_notify
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

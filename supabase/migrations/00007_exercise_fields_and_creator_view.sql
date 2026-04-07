-- Add training-specific columns to exercises
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS rest_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS rpe NUMERIC,
  ADD COLUMN IF NOT EXISTS tempo TEXT;

-- Create a view that joins creators with their profile name
-- This makes it easy to query creator info without nested joins
CREATE OR REPLACE VIEW public.creator_profiles AS
SELECT
  c.id AS creator_id,
  c.user_id,
  p.full_name,
  p.avatar_url,
  p.email,
  c.bio,
  c.credentials,
  c.specialties,
  c.follower_count,
  c.approved,
  c.created_at
FROM public.creators c
JOIN public.profiles p ON p.id = c.user_id;

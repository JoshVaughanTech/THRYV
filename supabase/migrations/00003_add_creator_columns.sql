-- Add follower_count and specialties columns to creators table
-- Needed for the coach baseball card carousel on the discover page

ALTER TABLE public.creators
  ADD COLUMN follower_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.creators
  ADD COLUMN specialties TEXT[];

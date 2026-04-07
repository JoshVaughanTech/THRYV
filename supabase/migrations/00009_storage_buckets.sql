-- THRYV MVP — Storage Buckets for Image Uploads
-- Creates public buckets for avatars and program covers with RLS policies

-- ============================================================
-- 1. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('program-covers', 'program-covers', true);

-- ============================================================
-- 2. AVATARS BUCKET POLICIES
-- ============================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder (user_id/*)
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can update their own avatar files
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can delete their own avatar files
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 3. PROGRAM-COVERS BUCKET POLICIES
-- ============================================================

-- Anyone can view program covers (public bucket)
CREATE POLICY "Anyone can view program covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'program-covers');

-- Creators can upload covers to their program folder (program_id/*)
-- Verifies the user owns the program via the creators table
CREATE POLICY "Creators can upload program covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'program-covers'
    AND EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.creator_id = public.get_creator_id()
    )
  );

-- Creators can update covers for their own programs
CREATE POLICY "Creators can update program covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'program-covers'
    AND EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.creator_id = public.get_creator_id()
    )
  );

-- Creators can delete covers for their own programs
CREATE POLICY "Creators can delete program covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'program-covers'
    AND EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.creator_id = public.get_creator_id()
    )
  );

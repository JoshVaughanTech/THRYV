-- Allow users to see posts from people they follow
CREATE POLICY "Users can view posts from followed users"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.follows f
      WHERE f.follower_id = auth.uid() AND f.following_id = posts.user_id
    )
  );

-- Allow users to always see their own posts
CREATE POLICY "Users can view own posts"
  ON public.posts FOR SELECT
  USING (user_id = auth.uid());

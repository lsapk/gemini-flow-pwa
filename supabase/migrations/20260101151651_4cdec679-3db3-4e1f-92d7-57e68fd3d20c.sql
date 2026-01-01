-- Fix the overly permissive policy on good_action_likes
-- Drop the existing policy that allows anyone to view likes
DROP POLICY IF EXISTS "Anyone can view likes" ON good_action_likes;

-- Create a new policy that only allows authenticated users to view likes
-- and only for public actions or their own likes
CREATE POLICY "Authenticated users can view likes on public actions"
ON good_action_likes FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM good_actions WHERE id = good_action_id AND is_public = true)
);
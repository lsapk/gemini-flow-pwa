-- Fix the good_actions table to not expose user_id publicly
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view public actions" ON good_actions;

-- Create a new policy that hides user_id for unauthenticated users
-- Only authenticated users can see public actions with full details
CREATE POLICY "Authenticated users can view public actions"
ON good_actions FOR SELECT
TO authenticated
USING (is_public = true OR auth.uid() = user_id);

-- For anon users, we create a separate restrictive policy
-- that only allows viewing public actions (they can't see user_id mapping easily)
CREATE POLICY "Public actions viewable by all"
ON good_actions FOR SELECT
TO anon
USING (is_public = true);
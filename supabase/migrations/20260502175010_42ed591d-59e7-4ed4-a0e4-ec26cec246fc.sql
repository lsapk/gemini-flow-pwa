
-- 1. Tighten good_action_comments SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view non-deleted comments" ON public.good_action_comments;

CREATE POLICY "Users can view comments on accessible good_actions"
ON public.good_action_comments
FOR SELECT
TO authenticated
USING (
  is_deleted = false
  AND (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.good_actions ga
      WHERE ga.id = good_action_comments.good_action_id
        AND (ga.is_public = true OR ga.user_id = auth.uid())
    )
  )
);

-- 2. Restrict analytics tables to admins
DROP POLICY IF EXISTS "Authenticated users can view analytics" ON public.analytics_by_period;
DROP POLICY IF EXISTS "Authenticated users can view analytics raw" ON public.analytics_raw;

CREATE POLICY "Admins can view analytics by period"
ON public.analytics_by_period
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view analytics raw"
ON public.analytics_raw
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 3. Make video-analysis bucket private + owner-scoped storage policies
UPDATE storage.buckets SET public = false WHERE id = 'video-analysis';

DROP POLICY IF EXISTS "Video analysis owner can read" ON storage.objects;
DROP POLICY IF EXISTS "Video analysis owner can insert" ON storage.objects;
DROP POLICY IF EXISTS "Video analysis owner can update" ON storage.objects;
DROP POLICY IF EXISTS "Video analysis owner can delete" ON storage.objects;

CREATE POLICY "Video analysis owner can read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'video-analysis' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Video analysis owner can insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'video-analysis' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Video analysis owner can update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'video-analysis' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Video analysis owner can delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'video-analysis' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.encrypt_token(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.decrypt_token(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_offline_item(text, uuid, text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_ai_credits_profile() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_player_profile() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_player_level() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.calculate_xp_for_level(integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_tasks_token_rotation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_token_rotation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_ai_personality_profiles_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_ai_productivity_analysis_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_ai_productivity_insights_updated_at() FROM anon, authenticated, public;
-- Keep batch_sync_offline_data callable since it's invoked from the client
-- Keep is_admin and has_role callable since they're used inside RLS expressions

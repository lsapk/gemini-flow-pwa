-- 1. Revoke EXECUTE on sensitive functions from anon and public
REVOKE EXECUTE ON FUNCTION public.encrypt_token(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.decrypt_token(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.calculate_xp_for_level(integer) FROM anon, public;

-- Grant explicitly to authenticated/service_role where needed (internal use)
GRANT EXECUTE ON FUNCTION public.encrypt_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_xp_for_level(integer) TO authenticated, service_role;

-- 2. Make avatars bucket private + scoped policies
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop existing avatar policies if any (idempotent)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Anyone (anon + auth) can read avatars (needed to display them)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Only owner can upload (folder = user id)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
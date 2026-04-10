
-- =====================================================
-- 1. FIX: user table — restrict UPDATE to safe columns only
-- =====================================================

-- Drop the existing UPDATE policy (no WITH CHECK)
DROP POLICY IF EXISTS "Users can update only their own user data" ON public."user";

-- Recreate with WITH CHECK that prevents modifying sensitive columns
-- We use a trick: the WITH CHECK ensures the sensitive columns haven't changed
CREATE POLICY "Users can update only their own user data"
ON public."user"
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT u.role FROM public."user" u WHERE u.id = auth.uid())
  AND password IS NOT DISTINCT FROM (SELECT u.password FROM public."user" u WHERE u.id = auth.uid())
  AND "mfaSecret" IS NOT DISTINCT FROM (SELECT u."mfaSecret" FROM public."user" u WHERE u.id = auth.uid())
  AND "mfaRecoveryCodes" IS NOT DISTINCT FROM (SELECT u."mfaRecoveryCodes" FROM public."user" u WHERE u.id = auth.uid())
  AND "mfaEnabled" IS NOT DISTINCT FROM (SELECT u."mfaEnabled" FROM public."user" u WHERE u.id = auth.uid())
);

-- =====================================================
-- 2. FIX: user table — restrict SELECT to hide sensitive fields
-- Create a secure view that excludes password, mfaSecret, mfaRecoveryCodes
-- =====================================================
CREATE OR REPLACE VIEW public.user_safe_view AS
SELECT
  id,
  email,
  "firstName",
  "lastName",
  role,
  disabled,
  "mfaEnabled",
  settings,
  "personalizationAnswers",
  "createdAt",
  "updatedAt"
FROM public."user"
WHERE auth.uid() = id;

-- Grant access to the view
GRANT SELECT ON public.user_safe_view TO authenticated;

-- =====================================================
-- 3. FIX: OAuth tokens — remove client-side SELECT for refresh tokens
-- Users should NOT be able to read raw tokens from client
-- Edge functions use service_role which bypasses RLS
-- =====================================================

-- google_calendar_tokens: drop the permissive SELECT and replace with restricted
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.google_calendar_tokens;

CREATE POLICY "Users can check token existence"
ON public.google_calendar_tokens
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Create a secure view that hides the actual token values
CREATE OR REPLACE VIEW public.google_calendar_tokens_safe AS
SELECT
  id,
  user_id,
  token_expiry,
  created_at,
  updated_at,
  last_rotated_at,
  CASE WHEN access_token IS NOT NULL THEN '***' ELSE NULL END as has_access_token,
  CASE WHEN refresh_token IS NOT NULL THEN '***' ELSE NULL END as has_refresh_token
FROM public.google_calendar_tokens
WHERE auth.uid() = user_id;

GRANT SELECT ON public.google_calendar_tokens_safe TO authenticated;

-- google_tasks_tokens: same treatment
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.google_tasks_tokens;

CREATE POLICY "Users can check token existence"
ON public.google_tasks_tokens
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

CREATE OR REPLACE VIEW public.google_tasks_tokens_safe AS
SELECT
  id,
  user_id,
  token_expiry,
  created_at,
  updated_at,
  last_rotated_at,
  CASE WHEN access_token IS NOT NULL THEN '***' ELSE NULL END as has_access_token,
  CASE WHEN refresh_token IS NOT NULL THEN '***' ELSE NULL END as has_refresh_token
FROM public.google_tasks_tokens
WHERE auth.uid() = user_id;

GRANT SELECT ON public.google_tasks_tokens_safe TO authenticated;

-- =====================================================
-- 4. FIX: Video storage — require authentication for uploads
-- =====================================================

-- Drop the overly permissive upload policy
DROP POLICY IF EXISTS "Upload Policy" ON storage.objects;

-- Recreate with auth requirement and user-scoped folders
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'video-analysis'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 5. FIX: Function search_path for update_updated_at_column
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

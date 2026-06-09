
-- Revoke anon execute on functions that should require auth
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(text, integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- oauth_authorizations: ensure no client-role access (only service_role via edge functions)
REVOKE ALL ON public.oauth_authorizations FROM anon, authenticated;
GRANT ALL ON public.oauth_authorizations TO service_role;

DROP POLICY IF EXISTS "Deny all client access to oauth_authorizations" ON public.oauth_authorizations;
CREATE POLICY "Deny all client access to oauth_authorizations"
ON public.oauth_authorizations
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

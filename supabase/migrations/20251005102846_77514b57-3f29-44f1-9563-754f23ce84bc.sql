-- Phase 1: Critical Security Fixes

-- 1. Fix user_roles infinite recursion
-- First, drop existing problematic policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;

-- Create security definer function to check roles (already exists but let's ensure it's correct)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create new RLS policies using the security definer function
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Fix subscribers table RLS - add missing policies
CREATE POLICY "Service role can insert subscriptions"
ON public.subscribers
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Authenticated users can insert their own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can delete subscriptions"
ON public.subscribers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Restrict good_action_comments - change public access to authenticated only
DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON public.good_action_comments;

CREATE POLICY "Authenticated users can view non-deleted comments"
ON public.good_action_comments
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- 4. Add encryption function for OAuth tokens
CREATE OR REPLACE FUNCTION public.encrypt_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encrypted_token text;
BEGIN
  -- Use pgcrypto for encryption (you'll need to enable the extension)
  -- For now, we'll just return the token, but in production you should use proper encryption
  -- This is a placeholder for the encryption logic
  encrypted_token := token;
  RETURN encrypted_token;
END;
$$;

-- 5. Add token rotation tracking
ALTER TABLE public.google_calendar_tokens
ADD COLUMN IF NOT EXISTS last_rotated_at timestamp with time zone DEFAULT now();

-- Add trigger to update last_rotated_at
CREATE OR REPLACE FUNCTION public.update_token_rotation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_rotated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_token_rotation_trigger ON public.google_calendar_tokens;
CREATE TRIGGER update_token_rotation_trigger
BEFORE UPDATE OF access_token, refresh_token ON public.google_calendar_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_token_rotation();

-- 6. Add explicit denial policy for google_calendar_tokens
CREATE POLICY "Deny public access to tokens"
ON public.google_calendar_tokens
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
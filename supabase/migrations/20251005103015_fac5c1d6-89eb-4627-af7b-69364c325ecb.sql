-- Fix search_path warnings for security functions

-- Update encrypt_token function with proper search_path
CREATE OR REPLACE FUNCTION public.encrypt_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encrypted_token text;
BEGIN
  encrypted_token := token;
  RETURN encrypted_token;
END;
$$;

-- Update update_token_rotation function with proper search_path
CREATE OR REPLACE FUNCTION public.update_token_rotation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_rotated_at = now();
  RETURN NEW;
END;
$$;
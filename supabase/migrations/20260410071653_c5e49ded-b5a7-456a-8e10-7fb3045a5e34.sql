
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.encrypt_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use a derived key from the service role key setting, with fallback
  encryption_key := coalesce(
    current_setting('app.settings.token_secret', true),
    'deepflow_default_encryption_key_change_me'
  );
  
  RETURN encode(
    pgp_sym_encrypt(token, encryption_key),
    'base64'
  );
END;
$$;

-- Also create a decrypt function for reading tokens
CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  encryption_key := coalesce(
    current_setting('app.settings.token_secret', true),
    'deepflow_default_encryption_key_change_me'
  );
  
  RETURN pgp_sym_decrypt(
    decode(encrypted_token, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails (e.g. token was stored in plain text before migration),
    -- return the token as-is for backward compatibility
    RETURN encrypted_token;
END;
$$;

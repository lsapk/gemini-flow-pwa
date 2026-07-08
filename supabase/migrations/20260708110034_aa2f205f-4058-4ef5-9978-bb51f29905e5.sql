CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.generate_group_invite_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  new_code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(encode(extensions.gen_random_bytes(6),'base64') from 1 for 8));
    new_code := regexp_replace(new_code, '[^A-Z0-9]', 'X', 'g');
    SELECT EXISTS(SELECT 1 FROM public.groups WHERE invite_code = new_code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_code;
END;
$function$;
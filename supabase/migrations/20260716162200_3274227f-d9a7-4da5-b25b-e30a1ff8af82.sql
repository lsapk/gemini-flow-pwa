CREATE OR REPLACE FUNCTION public.create_group(_name text, _description text DEFAULT NULL)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_group public.groups;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF trim(coalesce(_name, '')) = '' THEN
    RAISE EXCEPTION 'Group name is required';
  END IF;

  INSERT INTO public.groups (name, description, created_by)
  VALUES (trim(_name), nullif(trim(coalesce(_description, '')), ''), auth.uid())
  RETURNING * INTO v_group;

  RETURN v_group;
END;
$$;

REVOKE ALL ON FUNCTION public.create_group(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_group(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_group(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.generate_group_invite_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_group_invite_code() FROM anon;
REVOKE ALL ON FUNCTION public.generate_group_invite_code() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.generate_group_invite_code() TO service_role;

REVOKE ALL ON FUNCTION public.set_group_created_by() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_group_created_by() FROM anon;
REVOKE ALL ON FUNCTION public.set_group_created_by() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_group_created_by() TO service_role;

REVOKE ALL ON FUNCTION public.add_group_creator_as_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_group_creator_as_admin() FROM anon;
REVOKE ALL ON FUNCTION public.add_group_creator_as_admin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.add_group_creator_as_admin() TO service_role;

REVOKE ALL ON FUNCTION public.set_group_invite_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_group_invite_code() FROM anon;
REVOKE ALL ON FUNCTION public.set_group_invite_code() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_group_invite_code() TO service_role;

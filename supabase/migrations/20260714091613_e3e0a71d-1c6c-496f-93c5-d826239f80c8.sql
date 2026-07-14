-- Ensure group creation works consistently through database-side ownership and membership.
CREATE OR REPLACE FUNCTION public.generate_group_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  new_code text;
  exists_already boolean;
BEGIN
  LOOP
    new_code := upper(substring(encode(extensions.gen_random_bytes(6), 'base64') from 1 for 8));
    new_code := regexp_replace(new_code, '[^A-Z0-9]', 'X', 'g');

    SELECT EXISTS(
      SELECT 1 FROM public.groups WHERE invite_code = new_code
    ) INTO exists_already;

    EXIT WHEN NOT exists_already;
  END LOOP;

  RETURN new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_group_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  NEW.created_by := auth.uid();

  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_group_invite_code();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_group_creator_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_group_created_by ON public.groups;
CREATE TRIGGER trg_set_group_created_by
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_group_created_by();

DROP TRIGGER IF EXISTS trg_add_group_creator_as_admin ON public.groups;
CREATE TRIGGER trg_add_group_creator_as_admin
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.add_group_creator_as_admin();

CREATE OR REPLACE FUNCTION public.create_group(_name text, _description text DEFAULT NULL)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION public.create_group(text, text) TO authenticated;

-- Keep RLS policies explicit and remove older duplicate habit policies that used PUBLIC roles.
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres habitudes" ON public.habits;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres habitudes" ON public.habits;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres habitudes" ON public.habits;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres habitudes" ON public.habits;
DROP POLICY IF EXISTS "Users can create own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;

CREATE POLICY "Users can view own habits"
ON public.habits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits"
ON public.habits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
ON public.habits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
ON public.habits
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own habit completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can delete their own habit completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can view their own habit completions" ON public.habit_completions;

CREATE POLICY "Users can view own habit completions"
ON public.habit_completions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habit completions"
ON public.habit_completions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit completions"
ON public.habit_completions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix nullable ownership on habit completions used by RLS.
UPDATE public.habit_completions hc
SET user_id = h.user_id
FROM public.habits h
WHERE hc.habit_id = h.id
  AND hc.user_id IS NULL;

ALTER TABLE public.habit_completions
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN completed_date SET NOT NULL,
ALTER COLUMN created_at SET NOT NULL;

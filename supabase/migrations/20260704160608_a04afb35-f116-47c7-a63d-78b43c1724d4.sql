
-- Add invite_code to groups
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Generator function
CREATE OR REPLACE FUNCTION public.generate_group_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(encode(gen_random_bytes(6),'base64') from 1 for 8));
    new_code := regexp_replace(new_code, '[^A-Z0-9]', 'X', 'g');
    SELECT EXISTS(SELECT 1 FROM public.groups WHERE invite_code = new_code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Trigger to auto-fill invite_code
CREATE OR REPLACE FUNCTION public.set_group_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_group_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_group_invite_code ON public.groups;
CREATE TRIGGER trg_set_group_invite_code
BEFORE INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.set_group_invite_code();

-- Backfill existing groups
UPDATE public.groups SET invite_code = public.generate_group_invite_code() WHERE invite_code IS NULL;

-- Preview by code (returns limited info)
CREATE OR REPLACE FUNCTION public.get_group_by_code(_code TEXT)
RETURNS TABLE(id uuid, name text, description text, member_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.name, g.description,
    (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id)
  FROM public.groups g
  WHERE g.invite_code = upper(trim(_code))
  LIMIT 1;
$$;

-- Join by code
CREATE OR REPLACE FUNCTION public.join_group_by_code(_code TEXT)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_group_id FROM public.groups WHERE invite_code = upper(trim(_code));
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Code invalide';
  END IF;

  INSERT INTO public.group_members(group_id, user_id, role)
  VALUES (v_group_id, v_uid, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(TEXT) TO authenticated;

-- Ensure unique membership
DO $$ BEGIN
  ALTER TABLE public.group_members ADD CONSTRAINT group_members_group_user_unique UNIQUE (group_id, user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;

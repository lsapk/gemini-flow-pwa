-- Force created_by from auth.uid() via trigger, ensure creator becomes admin automatically
CREATE OR REPLACE FUNCTION public.set_group_created_by()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_group_created_by ON public.groups;
CREATE TRIGGER trg_set_group_created_by
  BEFORE INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_group_created_by();

CREATE OR REPLACE FUNCTION public.add_group_creator_as_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_add_group_creator_as_admin ON public.groups;
CREATE TRIGGER trg_add_group_creator_as_admin
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_group_creator_as_admin();

-- Relax INSERT policy: any authenticated user can create; trigger enforces created_by
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

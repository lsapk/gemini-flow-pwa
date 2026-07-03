
-- GROUPS
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- GROUP MEMBERS
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Security definer helpers (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id=_group_id AND user_id=_user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id=_group_id AND user_id=_user_id AND role='admin')
$$;

-- Policies: groups
CREATE POLICY "Members can view their groups" ON public.groups
  FOR SELECT TO authenticated USING (public.is_group_member(id, auth.uid()));
CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update group" ON public.groups
  FOR UPDATE TO authenticated USING (public.is_group_admin(id, auth.uid()));
CREATE POLICY "Admins can delete group" ON public.groups
  FOR DELETE TO authenticated USING (public.is_group_admin(id, auth.uid()));

-- Policies: group_members
CREATE POLICY "Members can view group members" ON public.group_members
  FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Users can add themselves or admins add others" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Admins can update members" ON public.group_members
  FOR UPDATE TO authenticated USING (public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Admins or self can remove" ON public.group_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_group_admin(group_id, auth.uid()));

-- GROUP MESSAGES
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_messages TO authenticated;
GRANT ALL ON public.group_messages TO service_role;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read messages" ON public.group_messages
  FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Members can post messages" ON public.group_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Authors can delete own messages" ON public.group_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- GROUP INVITATIONS
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_invitations TO authenticated;
GRANT ALL ON public.group_invitations TO service_role;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view group invitations" ON public.group_invitations
  FOR SELECT TO authenticated
  USING (public.is_group_admin(group_id, auth.uid()) OR lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), '')));
CREATE POLICY "Admins can create invitations" ON public.group_invitations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = inviter_id AND public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Invitee or admin can update invitation" ON public.group_invitations
  FOR UPDATE TO authenticated
  USING (lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), '')) OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Admins can delete invitations" ON public.group_invitations
  FOR DELETE TO authenticated USING (public.is_group_admin(group_id, auth.uid()));

-- SHARED TASKS / HABITS / GOALS
CREATE TABLE IF NOT EXISTS public.shared_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, group_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_tasks TO authenticated;
GRANT ALL ON public.shared_tasks TO service_role;
ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view shared tasks" ON public.shared_tasks
  FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Owner can share own task" ON public.shared_tasks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = shared_by AND public.is_group_member(group_id, auth.uid())
    AND EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid()));
CREATE POLICY "Owner can unshare" ON public.shared_tasks
  FOR DELETE TO authenticated
  USING (auth.uid() = shared_by OR public.is_group_admin(group_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.shared_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, group_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_habits TO authenticated;
GRANT ALL ON public.shared_habits TO service_role;
ALTER TABLE public.shared_habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view shared habits" ON public.shared_habits
  FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Owner can share own habit" ON public.shared_habits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = shared_by AND public.is_group_member(group_id, auth.uid())
    AND EXISTS (SELECT 1 FROM public.habits WHERE id = habit_id AND user_id = auth.uid()));
CREATE POLICY "Owner can unshare habit" ON public.shared_habits
  FOR DELETE TO authenticated
  USING (auth.uid() = shared_by OR public.is_group_admin(group_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.shared_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, group_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_goals TO authenticated;
GRANT ALL ON public.shared_goals TO service_role;
ALTER TABLE public.shared_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view shared goals" ON public.shared_goals
  FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Owner can share own goal" ON public.shared_goals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = shared_by AND public.is_group_member(group_id, auth.uid())
    AND EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid()));
CREATE POLICY "Owner can unshare goal" ON public.shared_goals
  FOR DELETE TO authenticated
  USING (auth.uid() = shared_by OR public.is_group_admin(group_id, auth.uid()));

-- Triggers to keep updated_at fresh
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_group_invitations_updated_at BEFORE UPDATE ON public.group_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

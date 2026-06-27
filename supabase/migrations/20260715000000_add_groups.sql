
-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_invitations table
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create group_messages table for chat
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sharing mechanism: Join tables for sharing items with groups
CREATE TABLE IF NOT EXISTS public.shared_tasks (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY(task_id, group_id)
);

CREATE TABLE IF NOT EXISTS public.shared_habits (
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY(habit_id, group_id)
);

CREATE TABLE IF NOT EXISTS public.shared_goals (
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY(goal_id, group_id)
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_goals ENABLE ROW LEVEL SECURITY;

-- Policies for groups
CREATE POLICY "Members can view groups" ON public.groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update groups" ON public.groups
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin')
  );

-- Policies for group_members
CREATE POLICY "Members can view group members" ON public.group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_id AND m.user_id = auth.uid())
  );

-- Policies for group_messages
CREATE POLICY "Members can view messages" ON public.group_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert messages" ON public.group_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_id AND user_id = auth.uid())
    AND auth.uid() = user_id
  );

-- Policies for invitations
CREATE POLICY "Invitees can view invitations" ON public.group_invitations
  FOR SELECT USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR inviter_id = auth.uid()
  );

-- Sharing policies
CREATE POLICY "Users can manage shared tasks" ON public.shared_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can view shared tasks" ON public.shared_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_id AND user_id = auth.uid())
  );

-- Similar for habits and goals
CREATE POLICY "Users can manage shared habits" ON public.shared_habits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.habits WHERE id = habit_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can view shared habits" ON public.shared_habits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can manage shared goals" ON public.shared_goals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can view shared goals" ON public.shared_goals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_id AND user_id = auth.uid())
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_goals TO authenticated;

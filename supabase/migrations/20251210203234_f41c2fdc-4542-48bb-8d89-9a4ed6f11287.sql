-- Add admin policies to view all user data for admin panel

-- Admin can view all user profiles
CREATE POLICY "Admins can view all user profiles"
ON public.user_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all tasks
CREATE POLICY "Admins can view all tasks"
ON public.tasks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all habits
CREATE POLICY "Admins can view all habits"
ON public.habits
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all goals
CREATE POLICY "Admins can view all goals"
ON public.goals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all focus sessions
CREATE POLICY "Admins can view all focus sessions"
ON public.focus_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all player profiles
CREATE POLICY "Admins can view all player profiles"
ON public.player_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
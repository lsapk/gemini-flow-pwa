-- Create banned_users table to track banned users
CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  banned_by UUID NOT NULL,
  reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view banned users
CREATE POLICY "Only admins can view banned users"
ON public.banned_users
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can ban users
CREATE POLICY "Only admins can ban users"
ON public.banned_users
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can unban users
CREATE POLICY "Only admins can unban users"
ON public.banned_users
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON public.banned_users(user_id);
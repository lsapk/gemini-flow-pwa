
-- Create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'creator');

-- Create a user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row-Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create a policy to allow users to view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for admins to manage all roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert admin user role for deepflow.ia@gmail.com
-- We'll use a function to do this to handle the case where the user might not exist yet
CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the user ID for deepflow.ia@gmail.com
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'deepflow.ia@gmail.com';
  
  -- If the user exists, make them an admin
  IF admin_user_id IS NOT NULL THEN
    -- Insert the admin role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Also give them creator role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'creator'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Add premium subscription for admin
    INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier)
    SELECT admin_user_id, 'deepflow.ia@gmail.com', true, 'Premium'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.subscribers WHERE user_id = admin_user_id
    );
  END IF;
END;
$$;

-- Run the function to set up admin user
SELECT public.setup_admin_user();

-- Create trigger function to set up admin when user is created
CREATE OR REPLACE FUNCTION public.setup_admin_on_user_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email = 'deepflow.ia@gmail.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
    
    -- Insert creator role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'creator'::app_role);
    
    -- Add premium subscription for admin
    INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier)
    VALUES (NEW.id, 'deepflow.ia@gmail.com', true, 'Premium');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER setup_admin_user_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.setup_admin_on_user_create();

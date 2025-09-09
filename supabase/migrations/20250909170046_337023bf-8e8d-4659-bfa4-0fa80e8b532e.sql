-- Enable RLS on sensitive system tables and create restrictive policies

-- Enable RLS on credentials_entity table
ALTER TABLE public.credentials_entity ENABLE ROW LEVEL SECURITY;

-- Enable RLS on settings table  
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invalid_auth_token table
ALTER TABLE public.invalid_auth_token ENABLE ROW LEVEL SECURITY;

-- Enable RLS on installed_packages table
ALTER TABLE public.installed_packages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on installed_nodes table
ALTER TABLE public.installed_nodes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other sensitive system tables
ALTER TABLE public.shared_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_relation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Create restrictive policies for credentials_entity (admin only)
CREATE POLICY "Only admins can access credentials"
ON public.credentials_entity
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create restrictive policies for settings (admin only)
CREATE POLICY "Only admins can access settings"
ON public.settings
FOR ALL  
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create restrictive policies for invalid_auth_token (admin only)
CREATE POLICY "Only admins can access invalid tokens"
ON public.invalid_auth_token
FOR ALL
TO authenticated  
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create restrictive policies for installed_packages (admin only)
CREATE POLICY "Only admins can access installed packages"
ON public.installed_packages
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create restrictive policies for installed_nodes (admin only)
CREATE POLICY "Only admins can access installed nodes"
ON public.installed_nodes
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create restrictive policies for shared_credentials (admin only)
CREATE POLICY "Only admins can access shared credentials"
ON public.shared_credentials
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create restrictive policies for project_relation (admin only)
CREATE POLICY "Only admins can access project relations"
ON public.project_relation
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create restrictive policies for project (admin only)
CREATE POLICY "Only admins can access projects"
ON public.project
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create restrictive policies for role (admin only)
CREATE POLICY "Only admins can access roles"
ON public.role
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
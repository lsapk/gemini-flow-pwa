-- Enable RLS on remaining tables and add appropriate policies

-- Enable RLS on the remaining tables
ALTER TABLE public.test_metric ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_run ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_entity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_entity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows_tags ENABLE ROW LEVEL SECURITY;

-- Add admin-only policies for test metrics and runs
CREATE POLICY "Only admins can access test metrics"
ON public.test_metric
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access test runs"
ON public.test_run
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add admin-only policies for user API keys (very sensitive)
CREATE POLICY "Only admins can access user API keys"
ON public.user_api_keys
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add admin-only policies for variables
CREATE POLICY "Only admins can access variables"
ON public.variables
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add admin-only policies for webhook entity
CREATE POLICY "Only admins can access webhook entity"
ON public.webhook_entity
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add admin-only policies for workflow entity
CREATE POLICY "Only admins can access workflow entity"
ON public.workflow_entity
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add admin-only policies for workflow history
CREATE POLICY "Only admins can access workflow history"
ON public.workflow_history
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add admin-only policies for workflow statistics
CREATE POLICY "Only admins can access workflow statistics"
ON public.workflow_statistics
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add admin-only policies for workflow tags
CREATE POLICY "Only admins can access workflow tags"
ON public.workflows_tags
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
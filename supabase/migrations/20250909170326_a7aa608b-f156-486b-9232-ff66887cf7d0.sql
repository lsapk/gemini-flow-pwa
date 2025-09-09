-- Add RLS policies to the remaining tables that have RLS enabled but no policies

-- Analytics tables - These appear to be system analytics, allow read access for authenticated users
CREATE POLICY "Authenticated users can view analytics"
ON public.analytics_by_period
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view analytics metadata"
ON public.analytics_metadata  
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view analytics raw"
ON public.analytics_raw
FOR SELECT
TO authenticated
USING (true);

-- Auth and identity tables - admin only
CREATE POLICY "Only admins can access auth identity"
ON public.auth_identity
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access auth sync history"
ON public.auth_provider_sync_history
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Annotation and tag tables - admin only 
CREATE POLICY "Only admins can access annotation tags"
ON public.annotation_tag_entity
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access tag entities"
ON public.tag_entity
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Event and execution tables - admin only
CREATE POLICY "Only admins can access event destinations"
ON public.event_destinations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access execution annotations"
ON public.execution_annotations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access execution annotation tags"
ON public.execution_annotation_tags
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access execution data"
ON public.execution_data
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access execution entity"
ON public.execution_entity
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access execution metadata"
ON public.execution_metadata
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Folder and workflow tables - admin only
CREATE POLICY "Only admins can access folders"
ON public.folder
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access folder tags"
ON public.folder_tag
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access shared workflows"
ON public.shared_workflow
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Migration and processed data - admin only
CREATE POLICY "Only admins can access migrations"
ON public.migrations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access processed data"
ON public.processed_data
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Test case tables - admin only
CREATE POLICY "Only admins can access test case execution"
ON public.test_case_execution
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can access test definition"
ON public.test_definition
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
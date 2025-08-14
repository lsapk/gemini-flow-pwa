-- First, remove the insecure public access policies
DROP POLICY IF EXISTS "Allow public read access" ON public.video_analyses;
DROP POLICY IF EXISTS "Allow public insert access" ON public.video_analyses;

-- For existing records with NULL user_id, we need to either:
-- 1. Delete them (if they're orphaned/test data)
-- 2. Or assign them to a default admin user
-- Since this is a security fix, we'll delete orphaned records
DELETE FROM public.video_analyses WHERE user_id IS NULL;

-- Now make user_id NOT NULL to ensure proper ownership tracking
ALTER TABLE public.video_analyses ALTER COLUMN user_id SET NOT NULL;

-- Create secure RLS policies that restrict access based on user ownership
CREATE POLICY "Users can view their own video analyses" 
ON public.video_analyses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video analyses" 
ON public.video_analyses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video analyses" 
ON public.video_analyses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video analyses" 
ON public.video_analyses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Optional: Allow admins to view all video analyses for moderation purposes
CREATE POLICY "Admins can view all video analyses" 
ON public.video_analyses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));
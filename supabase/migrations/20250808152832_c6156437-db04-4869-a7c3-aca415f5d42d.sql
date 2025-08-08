
-- Add linked_goal_id column to habits table
ALTER TABLE public.habits 
ADD COLUMN linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

-- Add linked_goal_id column to tasks table  
ALTER TABLE public.tasks 
ADD COLUMN linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

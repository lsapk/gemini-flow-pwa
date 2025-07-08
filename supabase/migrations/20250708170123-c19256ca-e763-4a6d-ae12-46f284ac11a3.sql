
-- Créer la table pour les sous-tâches
CREATE TABLE public.subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sort_order INTEGER DEFAULT 0,
  user_id UUID NOT NULL
);

-- Activer RLS
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les sous-tâches
CREATE POLICY "Users can view their own subtasks" 
  ON public.subtasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subtasks" 
  ON public.subtasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtasks" 
  ON public.subtasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subtasks" 
  ON public.subtasks 
  FOR DELETE 
  USING (auth.uid() = user_id);

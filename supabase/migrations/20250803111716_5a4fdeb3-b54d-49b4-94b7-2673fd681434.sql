
-- Ajouter les colonnes manquantes à la table subtasks
ALTER TABLE public.subtasks 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

-- Créer la table pour les sous-objectifs
CREATE TABLE IF NOT EXISTS public.subobjectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  parent_goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Activer RLS pour les sous-objectifs
ALTER TABLE public.subobjectives ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour les sous-objectifs
CREATE POLICY "Users can view their own subobjectives" 
  ON public.subobjectives 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subobjectives" 
  ON public.subobjectives 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subobjectives" 
  ON public.subobjectives 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subobjectives" 
  ON public.subobjectives 
  FOR DELETE 
  USING (auth.uid() = user_id);


-- Ajouter une colonne pour l'ordre des habitudes
ALTER TABLE public.habits ADD COLUMN sort_order integer DEFAULT 0;

-- Ajouter une colonne pour marquer les habitudes comme archivées
ALTER TABLE public.habits ADD COLUMN is_archived boolean DEFAULT false;

-- Ajouter une colonne pour l'ordre des tâches
ALTER TABLE public.tasks ADD COLUMN sort_order integer DEFAULT 0;

-- Ajouter une colonne pour les sous-tâches
ALTER TABLE public.tasks ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Ajouter une colonne pour marquer les objectifs comme archivés
ALTER TABLE public.goals ADD COLUMN is_archived boolean DEFAULT false;

-- Créer une table pour les sessions de focus en arrière-plan
CREATE TABLE public.background_focus_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  duration_minutes integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Ajouter RLS pour les sessions de focus en arrière-plan
ALTER TABLE public.background_focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own background focus sessions" 
  ON public.background_focus_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own background focus sessions" 
  ON public.background_focus_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own background focus sessions" 
  ON public.background_focus_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own background focus sessions" 
  ON public.background_focus_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Créer une table pour les actions en attente de l'IA
CREATE TABLE public.ai_pending_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  action_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '5 minutes')
);

-- Ajouter RLS pour les actions en attente
ALTER TABLE public.ai_pending_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pending actions" 
  ON public.ai_pending_actions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending actions" 
  ON public.ai_pending_actions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending actions" 
  ON public.ai_pending_actions 
  FOR DELETE 
  USING (auth.uid() = user_id);

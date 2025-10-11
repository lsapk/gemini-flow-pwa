-- Créer une table pour stocker les tokens Google Tasks
CREATE TABLE IF NOT EXISTS public.google_tasks_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_rotated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.google_tasks_tokens ENABLE ROW LEVEL SECURITY;

-- Deny public access by default
CREATE POLICY "Deny public access to tokens"
ON public.google_tasks_tokens
FOR ALL
USING (false)
WITH CHECK (false);

-- Users can view their own tokens
CREATE POLICY "Users can view their own tokens"
ON public.google_tasks_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own tokens"
ON public.google_tasks_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own tokens"
ON public.google_tasks_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own tokens"
ON public.google_tasks_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at et last_rotated_at
CREATE OR REPLACE FUNCTION public.update_tasks_token_rotation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_rotated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_google_tasks_tokens_rotation
BEFORE UPDATE ON public.google_tasks_tokens
FOR EACH ROW
WHEN (OLD.access_token IS DISTINCT FROM NEW.access_token)
EXECUTE FUNCTION public.update_tasks_token_rotation();
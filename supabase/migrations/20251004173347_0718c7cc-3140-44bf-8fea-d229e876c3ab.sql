-- Table pour stocker les tokens OAuth Google Calendar
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tokens"
  ON public.google_calendar_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON public.google_calendar_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON public.google_calendar_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON public.google_calendar_tokens
  FOR DELETE
  USING (auth.uid() = user_id);
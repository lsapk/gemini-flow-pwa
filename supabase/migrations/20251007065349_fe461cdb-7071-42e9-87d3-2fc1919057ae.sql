-- Table pour les profils de personnalité IA
CREATE TABLE IF NOT EXISTS public.ai_personality_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table pour les insights de productivité IA
CREATE TABLE IF NOT EXISTS public.ai_productivity_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insights_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table pour les analyses de productivité IA
CREATE TABLE IF NOT EXISTS public.ai_productivity_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.ai_personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_productivity_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_productivity_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour ai_personality_profiles
CREATE POLICY "Users can view their own personality profile"
  ON public.ai_personality_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personality profile"
  ON public.ai_personality_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personality profile"
  ON public.ai_personality_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personality profile"
  ON public.ai_personality_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies pour ai_productivity_insights
CREATE POLICY "Users can view their own productivity insights"
  ON public.ai_productivity_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own productivity insights"
  ON public.ai_productivity_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own productivity insights"
  ON public.ai_productivity_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own productivity insights"
  ON public.ai_productivity_insights
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies pour ai_productivity_analysis
CREATE POLICY "Users can view their own productivity analysis"
  ON public.ai_productivity_analysis
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own productivity analysis"
  ON public.ai_productivity_analysis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own productivity analysis"
  ON public.ai_productivity_analysis
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own productivity analysis"
  ON public.ai_productivity_analysis
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at sur ai_personality_profiles
CREATE OR REPLACE FUNCTION update_ai_personality_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_personality_profiles_updated_at
  BEFORE UPDATE ON public.ai_personality_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_personality_profiles_updated_at();

-- Trigger pour updated_at sur ai_productivity_insights
CREATE OR REPLACE FUNCTION update_ai_productivity_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_productivity_insights_updated_at
  BEFORE UPDATE ON public.ai_productivity_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_productivity_insights_updated_at();

-- Trigger pour updated_at sur ai_productivity_analysis
CREATE OR REPLACE FUNCTION update_ai_productivity_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_productivity_analysis_updated_at
  BEFORE UPDATE ON public.ai_productivity_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_productivity_analysis_updated_at();
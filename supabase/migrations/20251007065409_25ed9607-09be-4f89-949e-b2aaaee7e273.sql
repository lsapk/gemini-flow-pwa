-- Fix search_path for trigger functions
DROP FUNCTION IF EXISTS update_ai_personality_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_ai_productivity_insights_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_ai_productivity_analysis_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_ai_personality_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_ai_personality_profiles_updated_at
  BEFORE UPDATE ON public.ai_personality_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_personality_profiles_updated_at();

CREATE OR REPLACE FUNCTION update_ai_productivity_insights_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_ai_productivity_insights_updated_at
  BEFORE UPDATE ON public.ai_productivity_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_productivity_insights_updated_at();

CREATE OR REPLACE FUNCTION update_ai_productivity_analysis_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_ai_productivity_analysis_updated_at
  BEFORE UPDATE ON public.ai_productivity_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_productivity_analysis_updated_at();
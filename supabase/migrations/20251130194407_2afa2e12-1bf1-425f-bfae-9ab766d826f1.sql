-- Fix security issues in functions by setting search_path

-- Fix calculate_xp_for_level function
CREATE OR REPLACE FUNCTION calculate_xp_for_level(current_level INTEGER)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 100 * current_level * current_level;
END;
$$;

-- Fix update_player_level function
CREATE OR REPLACE FUNCTION update_player_level()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  xp_needed INTEGER;
BEGIN
  LOOP
    xp_needed := calculate_xp_for_level(NEW.level);
    EXIT WHEN NEW.experience_points < xp_needed;
    NEW.level := NEW.level + 1;
    NEW.credits := NEW.credits + (NEW.level * 10);
  END LOOP;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Fix create_player_profile function
CREATE OR REPLACE FUNCTION create_player_profile()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.player_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
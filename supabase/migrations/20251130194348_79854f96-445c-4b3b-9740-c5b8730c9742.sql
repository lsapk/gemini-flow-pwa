-- Table pour le profil de joueur (gamification)
CREATE TABLE IF NOT EXISTS public.player_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  experience_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  avatar_type TEXT NOT NULL DEFAULT 'cyber_knight',
  avatar_customization JSONB DEFAULT '{"helmet": "default", "armor": "default", "glow_color": "#a855f7"}'::jsonb,
  total_quests_completed INTEGER NOT NULL DEFAULT 0,
  credits INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les quêtes
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL, -- 'daily', 'weekly', 'achievement'
  category TEXT NOT NULL, -- 'tasks', 'habits', 'focus', 'journal'
  target_value INTEGER NOT NULL,
  current_progress INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL,
  reward_credits INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les power-ups actifs
CREATE TABLE IF NOT EXISTS public.active_powerups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  powerup_type TEXT NOT NULL, -- 'focus_boost', 'xp_multiplier', 'productivity_shield'
  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les achievements débloqués
CREATE TABLE IF NOT EXISTS public.unlocked_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_profiles
CREATE POLICY "Users can view their own player profile"
  ON public.player_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own player profile"
  ON public.player_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player profile"
  ON public.player_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for quests
CREATE POLICY "Users can view their own quests"
  ON public.quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quests"
  ON public.quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quests"
  ON public.quests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quests"
  ON public.quests FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for active_powerups
CREATE POLICY "Users can view their own powerups"
  ON public.active_powerups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own powerups"
  ON public.active_powerups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own powerups"
  ON public.active_powerups FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for unlocked_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.unlocked_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.unlocked_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION calculate_xp_for_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN 100 * current_level * current_level;
END;
$$ LANGUAGE plpgsql;

-- Function to update player level when XP changes
CREATE OR REPLACE FUNCTION update_player_level()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to auto-level up
CREATE TRIGGER player_level_update
  BEFORE UPDATE OF experience_points ON public.player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_player_level();

-- Function to create initial player profile
CREATE OR REPLACE FUNCTION create_player_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create player profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_player ON auth.users;
CREATE TRIGGER on_auth_user_created_player
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_player_profile();
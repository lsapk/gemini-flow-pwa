
-- =============================================
-- PENGUIN GAMIFICATION SYSTEM
-- =============================================

-- 1. Penguin Profiles - Core evolution & stats
CREATE TABLE public.penguin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stage TEXT NOT NULL DEFAULT 'egg' CHECK (stage IN ('egg', 'chick', 'explorer', 'emperor')),
  shrimp_total INTEGER NOT NULL DEFAULT 0,
  salmon_total INTEGER NOT NULL DEFAULT 0,
  golden_fish_total INTEGER NOT NULL DEFAULT 0,
  shrimp_today INTEGER NOT NULL DEFAULT 0,
  shrimp_daily_limit INTEGER NOT NULL DEFAULT 10,
  last_shrimp_reset DATE NOT NULL DEFAULT CURRENT_DATE,
  iceberg_size INTEGER NOT NULL DEFAULT 1,
  climate_state TEXT NOT NULL DEFAULT 'active' CHECK (climate_state IN ('active', 'rest')),
  equipped_accessories JSONB NOT NULL DEFAULT '[]'::jsonb,
  has_radio BOOLEAN NOT NULL DEFAULT false,
  has_library BOOLEAN NOT NULL DEFAULT false,
  has_lounge_chair BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.penguin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own penguin profile" ON public.penguin_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own penguin profile" ON public.penguin_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own penguin profile" ON public.penguin_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all penguin profiles" ON public.penguin_profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::text));

-- 2. Food Log - Track each food earned
CREATE TABLE public.penguin_food_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_type TEXT NOT NULL CHECK (food_type IN ('shrimp', 'salmon', 'golden_fish')),
  source TEXT NOT NULL, -- e.g. 'task_completed', 'focus_session', 'streak_7'
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.penguin_food_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own food log" ON public.penguin_food_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own food log" ON public.penguin_food_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Accessories - Unlockable items
CREATE TABLE public.penguin_accessories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  accessory_id TEXT NOT NULL,
  accessory_name TEXT NOT NULL,
  accessory_type TEXT NOT NULL CHECK (accessory_type IN ('scarf', 'hat', 'glasses', 'special')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, accessory_id)
);

ALTER TABLE public.penguin_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accessories" ON public.penguin_accessories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own accessories" ON public.penguin_accessories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Pearls - Insight rewards
CREATE TABLE public.penguin_pearls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pearl_type TEXT NOT NULL CHECK (pearl_type IN ('efficiency', 'resilience', 'necklace')),
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.penguin_pearls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pearls" ON public.penguin_pearls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pearls" ON public.penguin_pearls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pearls" ON public.penguin_pearls FOR UPDATE USING (auth.uid() = user_id);

-- 5. Expeditions - Themed challenges
CREATE TABLE public.penguin_expeditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  expedition_type TEXT NOT NULL DEFAULT 'weekly',
  target_value INTEGER NOT NULL DEFAULT 1,
  current_progress INTEGER NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL DEFAULT 'golden_fish',
  reward_amount INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.penguin_expeditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expeditions" ON public.penguin_expeditions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expeditions" ON public.penguin_expeditions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expeditions" ON public.penguin_expeditions FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_penguin_food_log_user ON public.penguin_food_log(user_id, earned_at DESC);
CREATE INDEX idx_penguin_pearls_user ON public.penguin_pearls(user_id, created_at DESC);
CREATE INDEX idx_penguin_expeditions_user ON public.penguin_expeditions(user_id, completed);

-- Auto-update trigger for penguin_profiles
CREATE TRIGGER update_penguin_profiles_updated_at
  BEFORE UPDATE ON public.penguin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

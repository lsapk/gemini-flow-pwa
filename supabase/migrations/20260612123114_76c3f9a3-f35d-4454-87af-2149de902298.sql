
CREATE TABLE public.ai_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  horizon_weeks INTEGER NOT NULL DEFAULT 12,
  intensity TEXT NOT NULL DEFAULT 'balanced',
  plan JSONB NOT NULL,
  task_ids UUID[] NOT NULL DEFAULT '{}',
  habit_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_roadmaps TO authenticated;
GRANT ALL ON public.ai_roadmaps TO service_role;

ALTER TABLE public.ai_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own roadmaps" ON public.ai_roadmaps
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_roadmaps_user_status ON public.ai_roadmaps(user_id, status, created_at DESC);

CREATE TRIGGER update_ai_roadmaps_updated_at
  BEFORE UPDATE ON public.ai_roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

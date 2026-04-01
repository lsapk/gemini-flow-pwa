
-- Drop daily quests functions
DROP FUNCTION IF EXISTS public.get_or_create_daily_quests(uuid);

-- Enforce strict Row Level Security (RLS) across all tables
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Add a function to ensure RLS is not bypassed
CREATE OR REPLACE FUNCTION auth.check_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to insert data for another user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

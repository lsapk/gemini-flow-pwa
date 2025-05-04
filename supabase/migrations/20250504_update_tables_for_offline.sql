
-- Make sure all tables have proper created_at, updated_at fields and offline_id
-- First, add offline_id to tasks if it doesn't exist
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS offline_id TEXT UNIQUE NULL;

-- Add synced_at to track when items were last synchronized
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add the same fields to habits
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS offline_id TEXT UNIQUE NULL;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ NULL;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add the same fields to goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS offline_id TEXT UNIQUE NULL;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ NULL;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add the same fields to journal entries
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS offline_id TEXT UNIQUE NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ NULL;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add the same fields to focus sessions
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS offline_id TEXT UNIQUE NULL;
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ NULL;
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create or update AI request tracking table
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own AI requests
CREATE POLICY IF NOT EXISTS "Users can view own AI requests"
ON public.ai_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own AI requests
CREATE POLICY IF NOT EXISTS "Users can insert own AI requests"
ON public.ai_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create subscription table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NULL,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT NULL,
  subscription_end TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription
CREATE POLICY IF NOT EXISTS "Users can view own subscription"
ON public.subscribers
FOR SELECT
USING (auth.uid() = user_id OR email = auth.email());

-- Create function to update subscribers table when user is created
CREATE OR REPLACE FUNCTION public.setup_new_subscriber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier)
  VALUES (NEW.id, NEW.email, false, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table if it doesn't exist
DROP TRIGGER IF EXISTS setup_subscriber_trigger ON auth.users;
CREATE TRIGGER setup_subscriber_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.setup_new_subscriber();

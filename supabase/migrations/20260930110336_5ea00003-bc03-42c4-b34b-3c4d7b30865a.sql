ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS ical_url text, ADD COLUMN IF NOT EXISTS but_program text;
CREATE TABLE public.but_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id text NOT NULL,
  semester int NOT NULL,
  module_code text NOT NULL,
  value numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id, semester, module_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.but_grades TO authenticated;
GRANT ALL ON public.but_grades TO service_role;
ALTER TABLE public.but_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own but grades" ON public.but_grades FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
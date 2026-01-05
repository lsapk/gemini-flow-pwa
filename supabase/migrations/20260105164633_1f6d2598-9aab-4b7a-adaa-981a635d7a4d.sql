-- Create admin_announcements table for status bar
CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  announcement_type TEXT DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'success', 'update')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active announcements
CREATE POLICY "Anyone can read active announcements"
  ON public.admin_announcements
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can do everything (using user_roles table)
CREATE POLICY "Admins can manage announcements"
  ON public.admin_announcements
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at (if function doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_announcements_updated_at
  BEFORE UPDATE ON public.admin_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
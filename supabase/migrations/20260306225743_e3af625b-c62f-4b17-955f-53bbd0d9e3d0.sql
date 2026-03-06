
CREATE TABLE public.section_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.section_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read visibility settings
CREATE POLICY "Anyone can view section settings"
ON public.section_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can update
CREATE POLICY "Admins can manage section settings"
ON public.section_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default values
INSERT INTO public.section_settings (section, is_visible) VALUES
  ('gallery', true),
  ('projects', true),
  ('skills', true),
  ('archive', true);

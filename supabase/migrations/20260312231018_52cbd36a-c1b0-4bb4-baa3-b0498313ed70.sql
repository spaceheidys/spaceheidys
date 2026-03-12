
-- Secret door settings (single row for code, timer, background)
CREATE TABLE public.secret_door_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_code text NOT NULL DEFAULT 'Letmein',
  timer_seconds integer NOT NULL DEFAULT 60,
  background_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secret_door_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view secret door settings" ON public.secret_door_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage secret door settings" ON public.secret_door_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.secret_door_settings (secret_code, timer_seconds) VALUES ('Letmein', 60);

-- Secret door downloadable files
CREATE TABLE public.secret_door_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL DEFAULT '',
  file_url text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secret_door_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view secret door files" ON public.secret_door_files
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage secret door files" ON public.secret_door_files
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

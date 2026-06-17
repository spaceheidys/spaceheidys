CREATE TABLE IF NOT EXISTS public.secret_door_quadrants (
  id text PRIMARY KEY CHECK (id IN ('tl','tr','bl','br')),
  html_content text,
  file_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.secret_door_quadrants TO anon, authenticated;
GRANT ALL ON public.secret_door_quadrants TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.secret_door_quadrants TO authenticated;

ALTER TABLE public.secret_door_quadrants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read quadrants"
ON public.secret_door_quadrants FOR SELECT
USING (true);

CREATE POLICY "Admins can manage quadrants"
ON public.secret_door_quadrants FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.secret_door_quadrants (id) VALUES ('tl'),('tr'),('bl'),('br')
ON CONFLICT (id) DO NOTHING;
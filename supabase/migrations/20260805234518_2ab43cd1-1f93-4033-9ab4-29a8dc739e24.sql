CREATE TABLE public.capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.capabilities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capabilities TO authenticated;
GRANT ALL ON public.capabilities TO service_role;
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view capabilities" ON public.capabilities FOR SELECT USING (true);
CREATE POLICY "Admins can manage capabilities" ON public.capabilities FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.capabilities (label, sort_order) VALUES
 ('Art direction', 0), ('2D illustration', 1), ('UX & interface design', 2), ('Game concepts', 3), ('Creative technology', 4);
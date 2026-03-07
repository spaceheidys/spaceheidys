CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL DEFAULT '',
  icon_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage social links" ON public.social_links
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view social links" ON public.social_links
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (true);

-- Seed existing social links
INSERT INTO public.social_links (label, url, icon_url, sort_order) VALUES
  ('Behance', 'https://www.behance.net/Biko_Ku', '', 0),
  ('LinkedIn', 'https://www.linkedin.com/in/viktor-kudriavcev-94757990/', '', 1);
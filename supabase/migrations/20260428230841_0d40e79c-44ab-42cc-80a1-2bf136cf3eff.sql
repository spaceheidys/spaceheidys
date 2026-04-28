CREATE TABLE public.seo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  og_image_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seo settings"
ON public.seo_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage seo settings"
ON public.seo_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.seo_settings (page_key, title, description, og_image_url) VALUES
  ('default', 'BIKO KU — Creative Portfolio', 'Illustration portfolio by Viktor Ku. Black & white manga-inspired creative work.', ''),
  ('home', 'BIKO KU — Creative Portfolio', 'Illustration portfolio by Viktor Ku. Black & white manga-inspired creative work.', ''),
  ('gallery', 'Gallery — BIKO KU', 'Browse the full illustration gallery by Viktor Ku.', ''),
  ('shop', 'Shop — BIKO KU', 'Original prints and merchandise by Viktor Ku.', '');
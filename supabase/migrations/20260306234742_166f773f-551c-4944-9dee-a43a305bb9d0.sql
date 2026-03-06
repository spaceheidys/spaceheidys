
CREATE TABLE public.nav_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  label_jp text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.nav_buttons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view nav buttons" ON public.nav_buttons FOR SELECT USING (true);
CREATE POLICY "Admins can manage nav buttons" ON public.nav_buttons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.nav_buttons (key, label, label_jp, sort_order) VALUES
  ('about', 'ABOUT', 'アバウト', 0),
  ('portfolio', 'PORTFOLIO', 'ポートフォリオ', 1),
  ('gallery', 'GALLERY', 'ギャラリー', 2),
  ('contacts', 'CONTACTS', 'コンタクト', 3);


CREATE TABLE public.section_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.section_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage section content"
  ON public.section_content FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view section content"
  ON public.section_content FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.section_content (key, content) VALUES
  ('about', 'Welcome to BIKO KU — a creative portfolio showcasing illustration, manga art, and design work. This space is dedicated to sharing visual storytelling and artistic expression across various styles and mediums.'),
  ('contact_title', 'Cooperation & Commissions'),
  ('contact_body', 'For collaboration projects or custom commissions, please contact me via email. I''d be happy to discuss any ideas or concepts you have in mind.'),
  ('contact_email', 'spaceheidys@gmail.com');

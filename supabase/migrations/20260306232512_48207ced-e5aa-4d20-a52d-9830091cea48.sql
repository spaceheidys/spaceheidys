
CREATE TABLE public.page_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view page backgrounds"
  ON public.page_backgrounds FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage page backgrounds"
  ON public.page_backgrounds FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

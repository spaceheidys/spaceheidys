CREATE TABLE public.cube_faces (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'none',
  image_url TEXT,
  image_scale REAL NOT NULL DEFAULT 1,
  image_x REAL NOT NULL DEFAULT 0,
  image_y REAL NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cube_faces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cube faces"
ON public.cube_faces FOR SELECT
USING (true);

CREATE POLICY "Admins can manage cube faces"
ON public.cube_faces FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.cube_faces (id, title) VALUES
  (0, 'Front'),
  (1, 'Right'),
  (2, 'Back'),
  (3, 'Left'),
  (4, 'Top'),
  (5, 'Bottom');
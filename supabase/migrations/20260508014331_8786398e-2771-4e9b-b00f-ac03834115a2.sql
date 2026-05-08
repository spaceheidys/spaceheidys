-- Site visit counter
CREATE TABLE public.site_visits (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_visits_singleton CHECK (id = 1)
);

INSERT INTO public.site_visits (id, count) VALUES (1, 0);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visit count"
ON public.site_visits FOR SELECT
TO public
USING (true);

-- Atomic increment via SECURITY DEFINER RPC (no direct UPDATE policy)
CREATE OR REPLACE FUNCTION public.increment_site_visits()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE public.site_visits
  SET count = count + 1, updated_at = now()
  WHERE id = 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_site_visits() TO anon, authenticated;
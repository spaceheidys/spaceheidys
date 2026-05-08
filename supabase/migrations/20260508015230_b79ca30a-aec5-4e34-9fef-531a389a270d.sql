CREATE OR REPLACE FUNCTION public.reset_site_visits()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can reset the site visit counter';
  END IF;
  UPDATE public.site_visits SET count = 0, updated_at = now() WHERE id = 1;
  RETURN 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_site_visits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_site_visits() TO authenticated;
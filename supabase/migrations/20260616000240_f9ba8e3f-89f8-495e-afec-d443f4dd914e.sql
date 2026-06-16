DROP VIEW IF EXISTS public.secret_door_public_settings;
DROP FUNCTION IF EXISTS public.get_secret_door_public_settings();

CREATE OR REPLACE FUNCTION public.get_secret_door_public_settings()
 RETURNS TABLE(id uuid, timer_seconds integer, background_url text, music_enabled boolean, impulse_speed numeric, impulse_color text, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, timer_seconds, background_url, music_enabled, impulse_speed, impulse_color, updated_at
  FROM public.secret_door_settings
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;
$function$;

CREATE VIEW public.secret_door_public_settings AS
SELECT id, timer_seconds, background_url, music_enabled, impulse_speed, impulse_color, updated_at
FROM public.get_secret_door_public_settings();

GRANT SELECT ON public.secret_door_public_settings TO anon, authenticated;
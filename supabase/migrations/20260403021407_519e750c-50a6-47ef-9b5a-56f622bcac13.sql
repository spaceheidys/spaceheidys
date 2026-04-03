-- Drop the public SELECT policy that exposes secret_code
DROP POLICY IF EXISTS "Anyone can view secret door settings" ON public.secret_door_settings;

-- Create a restricted view that excludes secret_code
CREATE OR REPLACE VIEW public.secret_door_public_settings AS
SELECT id, timer_seconds, background_url, music_enabled, updated_at
FROM public.secret_door_settings;

-- Grant access to the view for public roles
GRANT SELECT ON public.secret_door_public_settings TO anon, authenticated;
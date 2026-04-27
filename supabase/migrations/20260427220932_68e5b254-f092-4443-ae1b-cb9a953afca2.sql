-- 1. Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Harden has_role: only ever check the currently signed-in user
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND user_id = _user_id
      AND role = _role
  );
$$;

-- 3. Recreate the public settings view as security_invoker (PG15+)
DROP VIEW IF EXISTS public.secret_door_public_settings;
CREATE VIEW public.secret_door_public_settings
WITH (security_invoker = true) AS
SELECT id, timer_seconds, background_url, music_enabled, updated_at
FROM public.secret_door_settings;

-- The base table blocks SELECT for non-admins, so add a permissive
-- read policy that exposes ONLY the non-sensitive columns through the view.
-- We do this by adding a SELECT policy on the base table that returns true,
-- but we restrict the view's columns. Since RLS is column-agnostic, we
-- instead grant a separate read path: keep the view as security_invoker and
-- add a narrow SELECT policy that allows everyone to read the row but the
-- application code (and the view) must only project safe columns.
-- To keep the secret_code protected at the database level, use a SECURITY
-- DEFINER function for the public read instead of a permissive policy.

DROP VIEW IF EXISTS public.secret_door_public_settings;

CREATE OR REPLACE FUNCTION public.get_secret_door_public_settings()
RETURNS TABLE (
  id uuid,
  timer_seconds integer,
  background_url text,
  music_enabled boolean,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, timer_seconds, background_url, music_enabled, updated_at
  FROM public.secret_door_settings
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_secret_door_public_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_secret_door_public_settings() TO anon, authenticated;

-- Recreate the view as a thin wrapper around the safe function so existing
-- frontend queries to `secret_door_public_settings` keep working.
CREATE VIEW public.secret_door_public_settings
WITH (security_invoker = true) AS
SELECT * FROM public.get_secret_door_public_settings();

GRANT SELECT ON public.secret_door_public_settings TO anon, authenticated;

-- 4. Add a hashed-code column and migrate any existing plaintext code into it
ALTER TABLE public.secret_door_settings
  ADD COLUMN IF NOT EXISTS secret_code_hash text;

UPDATE public.secret_door_settings
SET secret_code_hash = extensions.crypt(secret_code, extensions.gen_salt('bf', 12))
WHERE secret_code_hash IS NULL
  AND secret_code IS NOT NULL
  AND secret_code <> '';

-- Drop the plaintext column entirely
ALTER TABLE public.secret_door_settings
  DROP COLUMN IF EXISTS secret_code;

-- 5. Admin RPC to set a new code with strength rules
CREATE OR REPLACE FUNCTION public.set_secret_door_code(_new_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  normalized text := btrim(coalesce(_new_code, ''));
  target_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can set the secret door code';
  END IF;

  IF char_length(normalized) < 8 OR char_length(normalized) > 128 THEN
    RAISE EXCEPTION 'Secret code must be between 8 and 128 characters';
  END IF;

  IF normalized !~ '[A-Za-z]' OR normalized !~ '[0-9]' THEN
    RAISE EXCEPTION 'Secret code must include at least one letter and one number';
  END IF;

  IF lower(normalized) IN ('letmein', 'password', '12345678', 'qwerty123', 'admin123', 'secret123', 'letmein1') THEN
    RAISE EXCEPTION 'Choose a less predictable secret code';
  END IF;

  SELECT id INTO target_id
  FROM public.secret_door_settings
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF target_id IS NULL THEN
    INSERT INTO public.secret_door_settings (secret_code_hash, updated_at)
    VALUES (extensions.crypt(normalized, extensions.gen_salt('bf', 12)), now());
  ELSE
    UPDATE public.secret_door_settings
    SET secret_code_hash = extensions.crypt(normalized, extensions.gen_salt('bf', 12)),
        updated_at = now()
    WHERE id = target_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_secret_door_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_secret_door_code(text) TO authenticated;

-- 6. Server-side verification helper (used by the edge function via service role)
CREATE OR REPLACE FUNCTION public.verify_secret_door_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  normalized text := btrim(coalesce(_code, ''));
  stored_hash text;
BEGIN
  IF normalized = '' OR char_length(normalized) > 128 THEN
    RETURN false;
  END IF;

  SELECT secret_code_hash
  INTO stored_hash
  FROM public.secret_door_settings
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF stored_hash IS NULL OR stored_hash = '' THEN
    RETURN false;
  END IF;

  RETURN extensions.crypt(normalized, stored_hash) = stored_hash;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_secret_door_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_secret_door_code(text) TO service_role;
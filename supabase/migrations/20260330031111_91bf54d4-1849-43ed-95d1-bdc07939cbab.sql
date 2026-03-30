
-- Add username column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text DEFAULT '';

-- Update trigger to also set username from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(split_part(NEW.email, '@', 1), 'user'));
  RETURN NEW;
END;
$function$;

-- Allow users to insert their own profile (if trigger didn't fire)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

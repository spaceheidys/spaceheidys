
-- Create private storage bucket for secret door files
INSERT INTO storage.buckets (id, name, public) VALUES ('secret-door-private', 'secret-door-private', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only admins can manage files in the private bucket
CREATE POLICY "Admins can upload secret door files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'secret-door-private'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update secret door files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'secret-door-private'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete secret door files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'secret-door-private'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can read secret door files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'secret-door-private'
  AND public.has_role(auth.uid(), 'admin')
);

-- Remove public SELECT policy from secret_door_files table
DROP POLICY IF EXISTS "Anyone can view secret door files" ON public.secret_door_files;

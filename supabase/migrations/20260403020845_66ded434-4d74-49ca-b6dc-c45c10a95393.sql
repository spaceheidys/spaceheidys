-- Add UPDATE policy on portfolio-images storage bucket for admins only
CREATE POLICY "Admins can update portfolio images"
ON storage.objects
FOR UPDATE
TO authenticated
USING ((bucket_id = 'portfolio-images'::text) AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((bucket_id = 'portfolio-images'::text) AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view social links" ON public.social_links;
CREATE POLICY "Anyone can view social links" ON public.social_links
FOR SELECT TO anon, authenticated USING (true);

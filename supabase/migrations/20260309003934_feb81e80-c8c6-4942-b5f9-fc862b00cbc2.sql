-- Add share_url_template column to social_links for portfolio share buttons
ALTER TABLE public.social_links
  ADD COLUMN IF NOT EXISTS share_url_template text NOT NULL DEFAULT '';

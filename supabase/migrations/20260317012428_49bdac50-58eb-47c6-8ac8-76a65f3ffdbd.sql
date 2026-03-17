
ALTER TABLE public.social_links ADD COLUMN link_type text NOT NULL DEFAULT 'share';

-- Mark existing rows as 'share' (they were used for share functionality)
UPDATE public.social_links SET link_type = 'share' WHERE share_url_template != '';

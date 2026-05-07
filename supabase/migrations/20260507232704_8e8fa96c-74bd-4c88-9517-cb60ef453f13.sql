ALTER TABLE public.page_backgrounds ADD COLUMN IF NOT EXISTS time_of_day text NOT NULL DEFAULT 'any';
ALTER TABLE public.page_backgrounds DROP CONSTRAINT IF EXISTS page_backgrounds_time_of_day_check;
ALTER TABLE public.page_backgrounds ADD CONSTRAINT page_backgrounds_time_of_day_check CHECK (time_of_day IN ('any','morning','day','evening','night'));
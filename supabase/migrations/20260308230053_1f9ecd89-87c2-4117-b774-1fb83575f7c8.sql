ALTER TABLE public.portfolio_items 
ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS project_date text NOT NULL DEFAULT '';
-- Category enum
CREATE TYPE public.shop_category AS ENUM ('prints', 'merch');

-- Shop items table
CREATE TABLE public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category public.shop_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  main_image TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- Public can view visible items
CREATE POLICY "Anyone can view visible shop items"
ON public.shop_items
FOR SELECT
USING (visible = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can insert
CREATE POLICY "Admins can insert shop items"
ON public.shop_items
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can update
CREATE POLICY "Admins can update shop items"
ON public.shop_items
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can delete
CREATE POLICY "Admins can delete shop items"
ON public.shop_items
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_shop_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shop_items_updated_at
BEFORE UPDATE ON public.shop_items
FOR EACH ROW
EXECUTE FUNCTION public.update_shop_items_updated_at();

-- Index for sorting
CREATE INDEX idx_shop_items_category_sort ON public.shop_items (category, sort_order);
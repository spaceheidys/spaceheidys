ALTER TABLE public.portfolio_items
  ADD COLUMN image_offset_x real NOT NULL DEFAULT 50,
  ADD COLUMN image_offset_y real NOT NULL DEFAULT 50;
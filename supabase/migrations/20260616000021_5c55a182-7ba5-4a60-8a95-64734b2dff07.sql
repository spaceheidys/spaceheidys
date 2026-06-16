ALTER TABLE public.secret_door_settings
ADD COLUMN IF NOT EXISTS impulse_speed numeric NOT NULL DEFAULT 4,
ADD COLUMN IF NOT EXISTS impulse_color text NOT NULL DEFAULT '#ffffff';
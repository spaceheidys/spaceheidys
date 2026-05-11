CREATE TABLE public.visit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_hash TEXT NOT NULL,
  country TEXT,
  country_name TEXT,
  city TEXT,
  region TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_visit_logs_created_at ON public.visit_logs (created_at DESC);
CREATE INDEX idx_visit_logs_country ON public.visit_logs (country);
CREATE INDEX idx_visit_logs_visitor_hash ON public.visit_logs (visitor_hash);

ALTER TABLE public.visit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view visit logs"
ON public.visit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete visit logs"
ON public.visit_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
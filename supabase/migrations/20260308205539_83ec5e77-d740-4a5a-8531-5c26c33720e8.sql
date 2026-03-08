CREATE TABLE public.auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access auth_codes" ON public.auth_codes FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.self_checkout_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id integer NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  activated_by text NOT NULL DEFAULT '',
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.self_checkout_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access self_checkout_config" ON public.self_checkout_config FOR ALL USING (true) WITH CHECK (true);
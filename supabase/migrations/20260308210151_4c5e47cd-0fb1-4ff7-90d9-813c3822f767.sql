
CREATE TABLE public.card_holders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  pin text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.card_holders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access card_holders" ON public.card_holders FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  ean text NOT NULL DEFAULT '',
  holder_id uuid REFERENCES public.card_holders(id) ON DELETE SET NULL,
  balance numeric NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  pin text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access gift_cards" ON public.gift_cards FOR ALL USING (true) WITH CHECK (true);

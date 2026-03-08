
CREATE TABLE public.register_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id integer NOT NULL,
  type text NOT NULL DEFAULT 'Zaključek blagajne',
  cashier_name text NOT NULL,
  cashier_id text NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  cash numeric NOT NULL DEFAULT 0,
  card numeric NOT NULL DEFAULT 0,
  other numeric NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  closed_at timestamp with time zone NOT NULL DEFAULT now(),
  date date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.register_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access register_closings" ON public.register_closings FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.register_closings;

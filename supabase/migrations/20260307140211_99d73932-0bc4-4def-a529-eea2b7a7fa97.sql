
-- Transactions table for multi-device sync
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'gotovina',
  amount_paid numeric NOT NULL DEFAULT 0,
  change_amount numeric NOT NULL DEFAULT 0,
  cashier_id text NOT NULL,
  cashier_name text NOT NULL,
  invoice_data jsonb,
  voided boolean NOT NULL DEFAULT false,
  void_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Receipt number counter (resets yearly)
CREATE TABLE public.receipt_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  last_number integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Closing reports
CREATE TABLE public.closing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  cashier_name text NOT NULL,
  cashier_id text NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  cash numeric NOT NULL DEFAULT 0,
  card numeric NOT NULL DEFAULT 0,
  other numeric NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Gift vouchers
CREATE TABLE public.gift_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  amount numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  is_used boolean NOT NULL DEFAULT false,
  created_by text NOT NULL,
  used_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone
);

-- Business day status
CREATE TABLE public.business_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  opened_at timestamp with time zone,
  closed_at timestamp with time zone,
  opened_by text,
  closed_by text,
  status text NOT NULL DEFAULT 'closed'
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_days ENABLE ROW LEVEL SECURITY;

-- Public access policies (POS system, no auth)
CREATE POLICY "Public access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access receipt_counters" ON public.receipt_counters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access closing_reports" ON public.closing_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access gift_vouchers" ON public.gift_vouchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access business_days" ON public.business_days FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.closing_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_vouchers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_days;

-- Function to get next receipt number
CREATE OR REPLACE FUNCTION public.get_next_receipt_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_year integer;
  next_num integer;
BEGIN
  current_year := EXTRACT(YEAR FROM now());
  
  INSERT INTO receipt_counters (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_number = receipt_counters.last_number + 1, updated_at = now()
  RETURNING last_number INTO next_num;
  
  RETURN LPAD(next_num::text, 6, '0');
END;
$$;

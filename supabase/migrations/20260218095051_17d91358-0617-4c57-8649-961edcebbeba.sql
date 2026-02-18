-- Create partners table for company invoicing
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_number text NOT NULL,
  address text NOT NULL,
  city text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (same as products - internal system)
CREATE POLICY "Partners are readable by everyone"
ON public.partners FOR SELECT USING (true);

CREATE POLICY "Partners can be managed by anyone"
ON public.partners FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;

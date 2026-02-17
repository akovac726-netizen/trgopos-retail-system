
-- Products table for BackOffice management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ean TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Ostalo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are readable by everyone (POS needs to read them)
CREATE POLICY "Products are readable by everyone"
ON public.products
FOR SELECT
USING (true);

-- Products can be inserted/updated/deleted by anyone (BackOffice manages this, no auth system)
CREATE POLICY "Products can be managed by anyone"
ON public.products
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for products so TrgoPOS gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

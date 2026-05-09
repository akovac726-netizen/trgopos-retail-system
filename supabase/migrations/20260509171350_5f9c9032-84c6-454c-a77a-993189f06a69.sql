
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text DEFAULT '',
  ADD COLUMN IF NOT EXISTS catalog_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS internal_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS primary_group text DEFAULT '',
  ADD COLUMN IF NOT EXISTS secondary_group text DEFAULT '',
  ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'prodaja blaga - evidenca zaloge',
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'kos',
  ADD COLUMN IF NOT EXISTS package_qty numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS brand text DEFAULT '',
  ADD COLUMN IF NOT EXISTS country_of_origin text DEFAULT '',
  ADD COLUMN IF NOT EXISTS warranty_months integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS wholesale_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 22,
  ADD COLUMN IF NOT EXISTS purchase_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_warehouse_location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';

CREATE TABLE IF NOT EXISTS public.prevzemnice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number text NOT NULL,
  date_prevzemnice date NOT NULL DEFAULT CURRENT_DATE,
  date_prevzem date NOT NULL DEFAULT CURRENT_DATE,
  supplier text NOT NULL DEFAULT '',
  delivery_note_number text DEFAULT '',
  delivery_note_date date,
  order_reference text DEFAULT '',
  cost_center text DEFAULT '',
  warehouse text DEFAULT '',
  language_variant text DEFAULT 'slovenska',
  exchange_rate numeric DEFAULT 1,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'osnutek',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  created_by text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prevzemnice ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access prevzemnice" ON public.prevzemnice;
CREATE POLICY "Public access prevzemnice" ON public.prevzemnice FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.inventure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number text NOT NULL,
  inventory_number text DEFAULT '',
  warehouse text DEFAULT '',
  department text DEFAULT '',
  status text NOT NULL DEFAULT 'Nepotrjeno',
  date_inventure date NOT NULL DEFAULT CURRENT_DATE,
  responsible_person text DEFAULT '',
  referent text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventure ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access inventure" ON public.inventure;
CREATE POLICY "Public access inventure" ON public.inventure FOR ALL USING (true) WITH CHECK (true);

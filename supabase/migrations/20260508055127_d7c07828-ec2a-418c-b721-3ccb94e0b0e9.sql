
-- 1. locations
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'pe', -- 'pe' or 'gl_skl'
  address TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access locations" ON public.locations FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.locations (name, type, address) VALUES
  ('PE Ivančna Gorica - StandBuy', 'pe', 'Ljubljanska c. 1, 1295 Ivančna Gorica'),
  ('Glavno skladišče', 'gl_skl', 'Skladiščna pot 1, 1000 Ljubljana');

-- 2. location_stock
CREATE TABLE public.location_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (location_id, product_id)
);
ALTER TABLE public.location_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access location_stock" ON public.location_stock FOR ALL USING (true) WITH CHECK (true);

-- 3. dispatches (odpremnice)
CREATE TABLE public.dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_location UUID REFERENCES public.locations(id),
  to_location UUID REFERENCES public.locations(id),
  related_order_id UUID REFERENCES public.orders(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pripravljeno', -- pripravljeno|poslano|prejeto
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access dispatches" ON public.dispatches FOR ALL USING (true) WITH CHECK (true);

-- 4. dynamic_auth_codes
CREATE TABLE public.dynamic_auth_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dynamic_auth_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access dynamic_auth_codes" ON public.dynamic_auth_codes FOR ALL USING (true) WITH CHECK (true);

-- 5. cashier_closings_detail
CREATE TABLE public.cashier_closings_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  register_id INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cash NUMERIC NOT NULL DEFAULT 0,
  visa NUMERIC NOT NULL DEFAULT 0,
  master NUMERIC NOT NULL DEFAULT 0,
  diners NUMERIC NOT NULL DEFAULT 0,
  amex NUMERIC NOT NULL DEFAULT 0,
  other NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  operator TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cashier_closings_detail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access cashier_closings_detail" ON public.cashier_closings_detail FOR ALL USING (true) WITH CHECK (true);

-- 6. employee_documents
CREATE TABLE public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'foto',
  file_url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access employee_documents" ON public.employee_documents FOR ALL USING (true) WITH CHECK (true);

-- 7. product_images
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access product_images" ON public.product_images FOR ALL USING (true) WITH CHECK (true);

-- 8. equipment
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'skener', -- skener|samoplacilska|terminal|drugo
  serial TEXT NOT NULL DEFAULT '',
  location_id UUID REFERENCES public.locations(id),
  status TEXT NOT NULL DEFAULT 'aktivno',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access equipment" ON public.equipment FOR ALL USING (true) WITH CHECK (true);

-- 9. students
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  faculty TEXT NOT NULL DEFAULT '',
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  emso TEXT NOT NULL DEFAULT '',
  tax_number TEXT NOT NULL DEFAULT '',
  iban TEXT NOT NULL DEFAULT '',
  location_id UUID REFERENCES public.locations(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access students" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- 10. razširitev leave_requests
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS requested_by_id UUID REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS assigned_approver_id UUID REFERENCES public.employees(id);

-- 11. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Public write product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Public update product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "Public delete product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

CREATE POLICY "Public read employee-documents" ON storage.objects FOR SELECT USING (bucket_id = 'employee-documents');
CREATE POLICY "Public write employee-documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'employee-documents');
CREATE POLICY "Public update employee-documents" ON storage.objects FOR UPDATE USING (bucket_id = 'employee-documents');
CREATE POLICY "Public delete employee-documents" ON storage.objects FOR DELETE USING (bucket_id = 'employee-documents');

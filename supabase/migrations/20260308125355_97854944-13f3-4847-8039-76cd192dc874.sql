
-- Employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  code text NOT NULL DEFAULT '',
  birth_date text NOT NULL DEFAULT '',
  birth_place text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  hire_date text NOT NULL DEFAULT '',
  username text NOT NULL DEFAULT '',
  password text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'Slovenija',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  emso text NOT NULL DEFAULT '',
  tax_number text NOT NULL DEFAULT '',
  iban text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Leave requests table
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  type text NOT NULL DEFAULT 'Letni dopust',
  start_date text NOT NULL,
  end_date text NOT NULL,
  period text NOT NULL DEFAULT 'cel dan',
  approver text NOT NULL DEFAULT 'Admin (Direktor: Dženan Kedić)',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier text NOT NULL,
  date text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Poslano',
  from_profile text NOT NULL DEFAULT '',
  to_profile text NOT NULL DEFAULT '',
  marked_ordered boolean NOT NULL DEFAULT false,
  marked_shipped boolean NOT NULL DEFAULT false,
  received_confirmed boolean NOT NULL DEFAULT false,
  note text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Schedules table
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee text NOT NULL,
  day text NOT NULL,
  start_time text NOT NULL DEFAULT '08:00',
  end_time text NOT NULL DEFAULT '16:00',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Public access policies (POS system, no auth)
CREATE POLICY "Public access employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access leave_requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Insert default employees
INSERT INTO public.employees (first_name, last_name, code, position, hire_date, username, password, birth_date)
VALUES
  ('Dženan', 'Kedić', '70001', 'Vodja', '2024-01-15', '70001', '70001', '1990-01-01'),
  ('Eva', 'Zakrajšek', '70002', 'Blagajnik', '2024-03-01', '70002', '70002', '1995-05-10'),
  ('Študent', '1', '80001', 'Študentsko delo', '2025-01-10', '80001', '80001', '2003-09-15'),
  ('Študent', '2', '80002', 'Študentsko delo', '2025-02-15', '80002', '80002', '2004-02-20'),
  ('PODPORA', 'STANDBUY', '00087', 'Podpora', '2024-01-01', '00087', '00087', '');


CREATE TABLE public.terminal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone
);

ALTER TABLE public.terminal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access terminal_requests" ON public.terminal_requests FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.terminal_requests;

ALTER TABLE public.terminal_requests 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'payment',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
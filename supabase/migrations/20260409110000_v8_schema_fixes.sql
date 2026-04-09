-- Add missing columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add missing columns to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS expert_reply TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS expert_reply_at TIMESTAMPTZ;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS quality_rating INTEGER;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS communication_rating INTEGER;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS delivery_rating INTEGER;

-- Create deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.profiles(id),
  file_url TEXT NOT NULL,
  file_name TEXT,
  message TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS deliveries_order_id_idx ON public.deliveries(order_id);

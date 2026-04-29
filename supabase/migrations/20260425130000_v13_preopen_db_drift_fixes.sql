-- v13: 공개 테스트 전 DB drift 보강
-- schema.sql 기반 fresh DB와 기존 운영 DB 모두에서 누락 컬럼/테이블을 보정한다.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS service_count INTEGER DEFAULT 0;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

UPDATE public.services SET status = 'pending_review' WHERE status = 'pending';
UPDATE public.services SET status = 'suspended' WHERE status = 'inactive';

ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_status_check;
ALTER TABLE public.services ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.services
  ADD CONSTRAINT services_status_check
  CHECK (status IN ('draft', 'pending_review', 'active', 'rejected', 'suspended', 'deleted', 'reported'));

DROP POLICY IF EXISTS "Experts insert own services" ON public.services;
CREATE POLICY "Experts insert own services"
  ON public.services FOR INSERT
  WITH CHECK (
    auth.uid() = expert_id
    AND status IN ('draft', 'pending_review')
  );

DROP POLICY IF EXISTS "Experts read own services" ON public.services;
CREATE POLICY "Experts read own services"
  ON public.services FOR SELECT
  USING (auth.uid() = expert_id);

DROP POLICY IF EXISTS "Experts update own draft services" ON public.services;
CREATE POLICY "Experts update own draft services"
  ON public.services FOR UPDATE
  USING (auth.uid() = expert_id)
  WITH CHECK (
    auth.uid() = expert_id
    AND status IN ('draft', 'pending_review', 'deleted')
  );

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS reviewer_name TEXT,
  ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expert_reply TEXT,
  ADD COLUMN IF NOT EXISTS expert_reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quality_rating INTEGER,
  ADD COLUMN IF NOT EXISTS communication_rating INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_rating INTEGER;

ALTER TABLE public.quote_responses
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quote_responses_service_id_idx ON public.quote_responses(service_id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS pg_tx_id TEXT,
  ADD COLUMN IF NOT EXISTS refunded_amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_id TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.processed_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  webhook_type TEXT NOT NULL,
  webhook_timestamp TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payment_id, webhook_type, webhook_timestamp)
);
CREATE INDEX IF NOT EXISTS processed_webhooks_payment_id_idx ON public.processed_webhooks(payment_id);

CREATE OR REPLACE FUNCTION public.set_delivered_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    NEW.delivered_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_delivered_at ON public.orders;
CREATE TRIGGER trg_orders_delivered_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_delivered_at();

CREATE INDEX IF NOT EXISTS idx_orders_status_delivered_at
  ON public.orders(status, delivered_at)
  WHERE status = 'delivered';

CREATE TABLE IF NOT EXISTS public.expert_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  portfolio_urls TEXT[] DEFAULT '{}',
  introduction TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expert_applications
  ADD COLUMN IF NOT EXISTS id_verification_url TEXT,
  ADD COLUMN IF NOT EXISTS business_registration_url TEXT;

ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own expert applications" ON public.expert_applications;
CREATE POLICY "Users read own expert applications"
  ON public.expert_applications FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Users create own expert applications" ON public.expert_applications;
CREATE POLICY "Users create own expert applications"
  ON public.expert_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update expert applications" ON public.expert_applications;
CREATE POLICY "Admins update expert applications"
  ON public.expert_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified_name TEXT,
  ADD COLUMN IF NOT EXISTS verified_birth_date TEXT,
  ADD COLUMN IF NOT EXISTS verified_phone TEXT,
  ADD COLUMN IF NOT EXISTS verified_ci TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_verified_ci
  ON public.profiles(verified_ci)
  WHERE verified_ci IS NOT NULL;

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS max_discount_amount INTEGER,
  ADD COLUMN IF NOT EXISTS total_issued INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_used INTEGER DEFAULT 0;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events ALTER COLUMN type SET DEFAULT 'general';
ALTER TABLE public.events
  ADD CONSTRAINT events_type_check
  CHECK (type IN ('general', 'discount', 'fee', 'referral', 'contest'));

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS ticket_number TEXT,
  ADD COLUMN IF NOT EXISTS user_name TEXT,
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS admin_response TEXT,
  ADD COLUMN IF NOT EXISTS admin_id UUID,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

ALTER TABLE public.support_tickets
  ALTER COLUMN ticket_number SET DEFAULT (
    'TCK-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8))
  );

UPDATE public.support_tickets
SET ticket_number = 'TCK-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(id::text, 1, 8))
WHERE ticket_number IS NULL;

ALTER TABLE public.support_tickets ALTER COLUMN ticket_number SET NOT NULL;
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_priority_check;
ALTER TABLE public.support_tickets ALTER COLUMN priority SET DEFAULT 'medium';
ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_priority_check
  CHECK (priority IN ('low', 'normal', 'medium', 'high', 'urgent'));

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL DEFAULT 'service',
  target_id UUID,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read reports" ON public.reports;
CREATE POLICY "Admins read reports"
  ON public.reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Users create reports" ON public.reports;
CREATE POLICY "Users create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

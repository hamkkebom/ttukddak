-- v10: 자동 구매확정을 위한 delivered_at 추적

-- 1. orders.delivered_at 컬럼 추가
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 2. status 변경 시 delivered_at 자동 기록 (delivered 진입 시)
CREATE OR REPLACE FUNCTION set_delivered_at()
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
  EXECUTE FUNCTION set_delivered_at();

-- 3. 기존 delivered/completed 주문은 updated_at으로 백필
UPDATE public.orders
SET delivered_at = updated_at
WHERE status IN ('delivered', 'completed') AND delivered_at IS NULL;

-- 4. cron 쿼리 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_status_delivered_at
  ON public.orders(status, delivered_at)
  WHERE status = 'delivered';

-- 5. 신원 검증 서류 컬럼 추가 (expert_applications)
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

-- 6. 본인인증 결과 저장 (profiles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified_name TEXT,
  ADD COLUMN IF NOT EXISTS verified_birth_date TEXT,
  ADD COLUMN IF NOT EXISTS verified_phone TEXT,
  ADD COLUMN IF NOT EXISTS verified_ci TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 본인인증 CI 중복 체크 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_verified_ci
  ON public.profiles(verified_ci)
  WHERE verified_ci IS NOT NULL;

-- 7. Tier 0에서 누락된 핵심 인덱스들 (성능)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_expert_id ON public.services(expert_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

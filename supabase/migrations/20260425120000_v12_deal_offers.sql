-- v12: 고객-프리랜서 협의형 주문 전환(deal_offers)

-- 1. 대화방이 공개 견적요청 맥락도 담을 수 있게 확장
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS quote_request_id uuid references public.quote_requests(id) on delete set null;

CREATE INDEX IF NOT EXISTS idx_conversations_quote_request_id
  ON public.conversations(quote_request_id);

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS budget_min integer,
  ADD COLUMN IF NOT EXISTS budget_max integer;

ALTER TABLE public.quote_requests DROP CONSTRAINT IF EXISTS quote_requests_status_check;
ALTER TABLE public.quote_requests
  ADD CONSTRAINT quote_requests_status_check
  CHECK (status IN ('open', 'matched', 'quoted', 'in_discussion', 'closed'));

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read quote requests" ON public.quote_requests;
CREATE POLICY "Authenticated read quote requests"
  ON public.quote_requests FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      status IN ('open', 'matched', 'quoted', 'in_discussion')
      OR auth.uid() = requester_id
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Users create own quote requests" ON public.quote_requests;
CREATE POLICY "Users create own quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users update own quote requests" ON public.quote_requests;
CREATE POLICY "Users update own quote requests"
  ON public.quote_requests FOR UPDATE
  USING (
    auth.uid() = requester_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 2. 메시지 타입에 합의견적/시스템 이벤트 추가
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'file', 'image', 'quote', 'delivery', 'deal_offer', 'system'));

-- 3. 주문 상태와 협의형 주문 연결 컬럼 보강
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'virtual_account_issued',
    'paid',
    'in_progress',
    'delivered',
    'review',
    'review_pending',
    'revision_requested',
    'completed',
    'cancelled',
    'failed',
    'refund_requested',
    'refunded'
  ));

ALTER TABLE public.orders
  ALTER COLUMN order_number SET DEFAULT (
    'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8))
  );

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_id uuid references public.user_coupons(id) on delete set null;

-- 4. 합의견적 테이블
CREATE TABLE IF NOT EXISTS public.deal_offers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  expert_id uuid not null references public.experts(id) on delete cascade,
  title text not null,
  scope text not null,
  amount integer not null check (amount > 0),
  delivery_days integer not null check (delivery_days > 0),
  revisions integer not null default 1 check (revisions >= 0),
  memo text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  expires_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS deal_offer_id uuid references public.deal_offers(id) on delete set null;

CREATE INDEX IF NOT EXISTS idx_orders_deal_offer_id ON public.orders(deal_offer_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON public.orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_deal_offers_conversation_id ON public.deal_offers(conversation_id, created_at desc);
CREATE INDEX IF NOT EXISTS idx_deal_offers_buyer_id ON public.deal_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deal_offers_expert_id ON public.deal_offers(expert_id);
CREATE INDEX IF NOT EXISTS idx_deal_offers_status ON public.deal_offers(status);
CREATE UNIQUE INDEX IF NOT EXISTS deal_offers_one_accepted_per_conversation
  ON public.deal_offers(conversation_id)
  WHERE status = 'accepted';

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_deal_offers_updated_at ON public.deal_offers;
CREATE TRIGGER update_deal_offers_updated_at
  BEFORE UPDATE ON public.deal_offers
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at();

-- 5. RLS: 고객/프리랜서/관리자만 조회·변경 가능
ALTER TABLE public.deal_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read deal offers" ON public.deal_offers;
CREATE POLICY "Participants read deal offers"
  ON public.deal_offers FOR SELECT
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = expert_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Experts create deal offers" ON public.deal_offers;
CREATE POLICY "Experts create deal offers"
  ON public.deal_offers FOR INSERT
  WITH CHECK (
    auth.uid() = expert_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.seller_id = auth.uid()
        AND c.buyer_id = buyer_id
    )
  );

DROP POLICY IF EXISTS "Participants update deal offers" ON public.deal_offers;
CREATE POLICY "Participants update deal offers"
  ON public.deal_offers FOR UPDATE
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = expert_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    auth.uid() = buyer_id
    OR auth.uid() = expert_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 6. 납품물 테이블 정리: canonical table은 public.deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  expert_id uuid not null references public.profiles(id),
  file_url text not null,
  file_name text,
  message text,
  version integer default 1,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS deliveries_order_id_idx ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS deliveries_expert_id_idx ON public.deliveries(expert_id);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read deliveries" ON public.deliveries;
CREATE POLICY "Participants read deliveries"
  ON public.deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Sellers create deliveries" ON public.deliveries;
CREATE POLICY "Sellers create deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (
    auth.uid() = expert_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.seller_id = auth.uid()
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'deal_offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_offers;
  END IF;
END $$;

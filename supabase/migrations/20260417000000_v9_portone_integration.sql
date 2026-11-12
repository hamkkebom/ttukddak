-- PortOne integration - add transaction_id for reconciliation
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- PG사 거래 ID (토스 정산 문의 시 필수)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pg_tx_id TEXT;

-- 부분 환불 누적 금액 및 최근 취소 ID
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_amount INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_id TEXT;

-- Orders status: add 'pending' (결제 전), 'virtual_account_issued' (가상계좌 입금 대기), 'failed' (결제 실패)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'virtual_account_issued',
    'paid',
    'in_progress',
    'delivered',
    'review_pending',
    'revision_requested',
    'completed',
    'cancelled',
    'failed',
    'refund_requested',
    'refunded'
  ));

-- Webhook idempotency: record processed webhooks to prevent duplicate/out-of-order processing
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  webhook_type TEXT NOT NULL,
  webhook_timestamp TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payment_id, webhook_type, webhook_timestamp)
);
CREATE INDEX IF NOT EXISTS processed_webhooks_payment_id_idx ON public.processed_webhooks(payment_id);

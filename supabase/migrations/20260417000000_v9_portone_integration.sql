-- PortOne integration - add transaction_id for reconciliation
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Orders status: add 'pending' (결제 전), 'virtual_account_issued' (가상계좌 입금 대기), 'failed' (결제 실패)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'virtual_account_issued',
    'paid',
    'in_progress',
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

-- Migration v4: Service Approval Workflow
-- Adds rejection_reason column and updates status check constraint

-- 1. Add rejection_reason column
alter table public.services
  add column if not exists rejection_reason text;

-- 2. Drop old status check constraint (if named) and add new one
alter table public.services
  drop constraint if exists services_status_check;

alter table public.services
  add constraint services_status_check
  check (status in ('draft', 'pending_review', 'active', 'rejected', 'suspended', 'deleted', 'pending', 'inactive', 'reported'));

-- 3. Update existing statuses to match new schema
-- 'pending' → 'pending_review'
update public.services set status = 'pending_review' where status = 'pending';
-- 'inactive' → 'suspended'
update public.services set status = 'suspended' where status = 'inactive';
-- 'reported' → keep as-is for now (can be handled separately)

-- 4. Update the status check to use new canonical values
alter table public.services
  drop constraint if exists services_status_check;

alter table public.services
  add constraint services_status_check
  check (status in ('draft', 'pending_review', 'active', 'rejected', 'suspended', 'deleted', 'reported'));
-- Migration v5: Quote Responses
-- Allows experts to respond to client quote requests

-- 1. Create quote_responses table
create table if not exists public.quote_responses (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  expert_id uuid not null references public.profiles(id) on delete cascade,
  price integer not null,
  message text not null,
  estimated_days integer not null default 7,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists quote_responses_quote_request_id_idx on public.quote_responses(quote_request_id);
create index if not exists quote_responses_expert_id_idx on public.quote_responses(expert_id);

-- 3. Row Level Security
alter table public.quote_responses enable row level security;

-- Experts can insert their own responses
create policy "Experts can insert quote responses"
  on public.quote_responses for insert
  with check (auth.uid() = expert_id);

-- Experts can read responses they submitted
create policy "Experts can read own responses"
  on public.quote_responses for select
  using (auth.uid() = expert_id);

-- Quote request owners can read responses to their requests
create policy "Request owners can read responses"
  on public.quote_responses for select
  using (
    auth.uid() = (
      select user_id from public.quote_requests where id = quote_request_id
    )
  );

-- Quote request owners can update (accept/reject) responses to their requests
create policy "Request owners can update response status"
  on public.quote_responses for update
  using (
    auth.uid() = (
      select user_id from public.quote_requests where id = quote_request_id
    )
  );
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL,
  min_order_amount INTEGER DEFAULT 0,
  max_discount_amount INTEGER,
  total_issued INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'general',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  user_email TEXT,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  message TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response TEXT,
  admin_id UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

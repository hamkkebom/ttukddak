-- 뚝딱 Database Schema
-- Supabase SQL Editor에서 실행

-- 1. 사용자 프로필
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'expert', 'admin')),
  is_expert_verified boolean default false,
  verified_name text,
  verified_birth_date text,
  verified_phone text,
  verified_ci text,
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 카테고리
create table public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  sort_order int default 0,
  service_count int default 0,
  created_at timestamptz default now()
);

-- 3. 전문가 프로필
create table public.experts (
  id uuid references public.profiles(id) on delete cascade primary key,
  title text not null,
  category_id text references public.categories(id),
  introduction text,
  skills text[] default '{}',
  tools text[] default '{}',
  is_prime boolean default false,
  is_master boolean default false,
  response_time text default '2시간 이내',
  completion_rate int default 100,
  rating numeric(3,2) default 0,
  review_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. 서비스
create table public.services (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid references public.experts(id) on delete cascade not null,
  category_id text references public.categories(id) not null,
  title text not null,
  description text,
  thumbnail_url text,
  images text[] default '{}',
  price int not null,
  tags text[] default '{}',
  is_prime boolean default false,
  is_fast_response boolean default false,
  status text default 'draft' check (status in ('draft', 'pending_review', 'active', 'rejected', 'suspended', 'deleted', 'reported')),
  view_count int default 0,
  sales_count int default 0,
  rating numeric(3,2) default 0,
  review_count int default 0,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3-1. 전문가 신청
create table public.expert_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text not null,
  phone text,
  category text not null,
  skills text[] default '{}',
  portfolio_urls text[] default '{}',
  introduction text,
  id_verification_url text,
  business_registration_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. 서비스 패키지
create table public.service_packages (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references public.services(id) on delete cascade not null,
  name text not null,
  price int not null,
  delivery_days int not null,
  revisions int default 1,
  features text[] default '{}',
  sort_order int default 0
);

-- 6. 주문
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null default ('ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  buyer_id uuid references public.profiles(id) not null,
  seller_id uuid references public.experts(id) not null,
  service_id uuid references public.services(id) not null,
  package_id uuid references public.service_packages(id),
  amount int not null,
  fee int default 0,
  status text default 'pending' check (status in ('pending', 'virtual_account_issued', 'paid', 'in_progress', 'delivered', 'review', 'review_pending', 'revision_requested', 'completed', 'cancelled', 'failed', 'refund_requested', 'refunded')),
  requirements text,
  payment_id text,
  transaction_id text,
  pg_tx_id text,
  refunded_amount int default 0,
  cancellation_id text,
  coupon_id uuid,
  deadline date,
  completed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. 리뷰
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade unique not null,
  service_id uuid references public.services(id) not null,
  reviewer_id uuid references public.profiles(id) not null,
  expert_id uuid references public.experts(id) not null,
  rating_overall int not null check (rating_overall between 1 and 5),
  rating_quality int check (rating_quality between 1 and 5),
  rating_communication int check (rating_communication between 1 and 5),
  rating_delivery int check (rating_delivery between 1 and 5),
  rating int default 5,
  reviewer_name text,
  helpful_count int default 0,
  expert_reply text,
  expert_reply_at timestamptz,
  quality_rating int,
  communication_rating int,
  delivery_rating int,
  content text,
  images text[] default '{}',
  is_public boolean default true,
  created_at timestamptz default now()
);

-- 8. 메시지 대화방
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  buyer_id uuid references public.profiles(id) not null,
  seller_id uuid references public.experts(id) not null,
  service_id uuid references public.services(id),
  order_id uuid references public.orders(id),
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz default now()
);

-- 9. 메시지
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  message_type text default 'text' check (message_type in ('text', 'file', 'image', 'quote', 'delivery', 'deal_offer', 'system')),
  file_url text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 10. 견적 요청
create table public.quote_requests (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) not null,
  category_id text references public.categories(id),
  category text,
  title text not null,
  description text,
  budget_range text,
  budget_min int,
  budget_max int,
  deadline text,
  contact_method text default 'message',
  reference_links text[] default '{}',
  status text default 'open' check (status in ('open', 'matched', 'quoted', 'in_discussion', 'closed')),
  created_at timestamptz default now()
);

alter table public.conversations
  add column quote_request_id uuid references public.quote_requests(id);

-- 11. 견적 응답
create table public.quotes (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.quote_requests(id) on delete cascade not null,
  expert_id uuid references public.experts(id) not null,
  amount int not null,
  message text,
  status text default 'sent' check (status in ('sent', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

-- 11-1. 합의견적
create table public.deal_offers (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  service_id uuid references public.services(id) not null,
  quote_request_id uuid references public.quote_requests(id),
  order_id uuid references public.orders(id),
  buyer_id uuid references public.profiles(id) not null,
  expert_id uuid references public.experts(id) not null,
  title text not null,
  scope text not null,
  amount int not null check (amount > 0),
  delivery_days int not null check (delivery_days > 0),
  revisions int default 1 check (revisions >= 0),
  memo text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  expires_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders
  add column deal_offer_id uuid references public.deal_offers(id);

create unique index deal_offers_one_accepted_per_conversation
  on public.deal_offers(conversation_id)
  where status = 'accepted';

-- 11-2. 납품물
create table public.deliveries (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  expert_id uuid references public.profiles(id) not null,
  file_url text not null,
  file_name text,
  message text,
  version int default 1,
  created_at timestamptz default now()
);

-- 12. 찜 (즐겨찾기)
create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, service_id)
);

-- 13. 알림
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('order', 'message', 'review', 'payment', 'promo', 'system')),
  title text not null,
  description text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 14. 정산
create table public.settlements (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid references public.experts(id) not null,
  order_id uuid references public.orders(id) not null,
  gross_amount int not null,
  fee_amount int not null,
  net_amount int not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'on_hold')),
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- 15. 이벤트/쿠폰
create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text default 'general' check (type in ('general', 'discount', 'fee', 'referral', 'contest')),
  status text default 'active' check (status in ('active', 'upcoming', 'ended')),
  start_date date,
  end_date date,
  image_url text,
  is_active boolean default true,
  participants_count int default 0,
  created_at timestamptz default now()
);

create table public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_type text check (discount_type in ('percent', 'fixed')),
  discount_value int not null,
  min_order_amount int default 0,
  max_discount_amount int,
  usage_limit int,
  used_count int default 0,
  total_issued int default 0,
  total_used int default 0,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table public.user_coupons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  coupon_id uuid references public.coupons(id) on delete cascade not null,
  is_used boolean default false,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  unique(user_id, coupon_id)
);

alter table public.orders
  add constraint orders_coupon_id_fkey foreign key (coupon_id) references public.user_coupons(id) on delete set null;

-- 16. 고객문의
create table public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  ticket_number text unique not null default ('TCK-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  user_id uuid references public.profiles(id) not null,
  user_name text,
  user_email text,
  category text not null,
  subject text not null,
  message text,
  priority text default 'medium' check (priority in ('low', 'normal', 'medium', 'high', 'urgent')),
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  admin_response text,
  admin_id uuid,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.support_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  sender_id uuid references public.profiles(id),
  is_admin boolean default false,
  content text not null,
  created_at timestamptz default now()
);

create table public.processed_webhooks (
  id uuid default gen_random_uuid() primary key,
  payment_id text not null,
  webhook_type text not null,
  webhook_timestamp timestamptz not null,
  processed_at timestamptz default now(),
  unique(payment_id, webhook_type, webhook_timestamp)
);

create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null default 'service',
  target_id uuid,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== RLS (Row Level Security) =====

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.experts enable row level security;
alter table public.expert_applications enable row level security;
alter table public.services enable row level security;
alter table public.service_packages enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quotes enable row level security;
alter table public.deal_offers enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.settlements enable row level security;
alter table public.events enable row level security;
alter table public.coupons enable row level security;
alter table public.user_coupons enable row level security;
alter table public.deliveries enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.processed_webhooks enable row level security;
alter table public.reports enable row level security;

-- Public read policies
create policy "Public read categories" on public.categories for select using (true);
create policy "Public read active services" on public.services for select using (status = 'active');
create policy "Public read service packages" on public.service_packages for select using (true);
create policy "Public read experts" on public.experts for select using (true);
create policy "Public read reviews" on public.reviews for select using (is_public = true);
create policy "Public read events" on public.events for select using (true);
create policy "Public read coupons" on public.coupons for select using (is_active = true);

-- Authenticated user policies
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users read own expert applications" on public.expert_applications for select using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Users create own expert applications" on public.expert_applications for insert with check (auth.uid() = user_id);
create policy "Admins update expert applications" on public.expert_applications for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Experts insert own services" on public.services for insert with check (
  auth.uid() = expert_id and status in ('draft', 'pending_review')
);
create policy "Experts read own services" on public.services for select using (auth.uid() = expert_id);
create policy "Experts update own draft services" on public.services for update using (auth.uid() = expert_id) with check (
  auth.uid() = expert_id and status in ('draft', 'pending_review', 'deleted')
);
create policy "Users read own orders" on public.orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Users read own conversations" on public.conversations for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Users read own messages" on public.messages for select using (
  conversation_id in (select id from public.conversations where buyer_id = auth.uid() or seller_id = auth.uid())
);
create policy "Authenticated read quote requests" on public.quote_requests for select using (
  auth.role() = 'authenticated'
  and (
    status in ('open', 'matched', 'quoted', 'in_discussion')
    or auth.uid() = requester_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
);
create policy "Users create own quote requests" on public.quote_requests for insert with check (auth.uid() = requester_id);
create policy "Users update own quote requests" on public.quote_requests for update using (
  auth.uid() = requester_id
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Participants read deal offers" on public.deal_offers for select using (
  auth.uid() = buyer_id
  or auth.uid() = expert_id
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Experts create deal offers" on public.deal_offers for insert with check (
  auth.uid() = expert_id
  and exists (
    select 1 from public.conversations
    where id = conversation_id and seller_id = auth.uid() and buyer_id = deal_offers.buyer_id
  )
);
create policy "Participants update deal offers" on public.deal_offers for update using (
  auth.uid() = buyer_id
  or auth.uid() = expert_id
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Users read own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "Users manage own favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "Users delete own favorites" on public.favorites for delete using (auth.uid() = user_id);
create policy "Users read own coupons" on public.user_coupons for select using (auth.uid() = user_id);
create policy "Participants read deliveries" on public.deliveries for select using (
  exists (
    select 1 from public.orders
    where id = deliveries.order_id and (buyer_id = auth.uid() or seller_id = auth.uid())
  )
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Sellers create deliveries" on public.deliveries for insert with check (
  auth.uid() = expert_id
  and exists (
    select 1 from public.orders
    where id = deliveries.order_id and seller_id = auth.uid()
  )
);
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users read own settlements" on public.settlements for select using (auth.uid() = expert_id);
create policy "Admins read reports" on public.reports for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Users create reports" on public.reports for insert with check (auth.uid() = reporter_id);

-- ===== Functions =====

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();
create trigger update_experts_updated_at before update on public.experts
  for each row execute procedure public.update_updated_at();
create trigger update_services_updated_at before update on public.services
  for each row execute procedure public.update_updated_at();
create trigger update_orders_updated_at before update on public.orders
  for each row execute procedure public.update_updated_at();
create trigger update_deal_offers_updated_at before update on public.deal_offers
  for each row execute procedure public.update_updated_at();

create or replace function public.set_delivered_at()
returns trigger as $$
begin
  if new.status = 'delivered' and (old.status is null or old.status != 'delivered') then
    new.delivered_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_orders_delivered_at before update on public.orders
  for each row execute procedure public.set_delivered_at();

create index if not exists idx_profiles_verified_ci on public.profiles(verified_ci) where verified_ci is not null;
create index if not exists idx_orders_status_delivered_at on public.orders(status, delivered_at) where status = 'delivered';
create index if not exists processed_webhooks_payment_id_idx on public.processed_webhooks(payment_id);

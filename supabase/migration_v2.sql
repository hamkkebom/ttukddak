-- ============================================
-- 뚝딱 스키마 v2 마이그레이션
-- 18 → 27 테이블 확장 + 컬럼 추가 + RLS 재작성
-- ============================================

-- ===== A. 기존 테이블 컬럼 추가 =====

-- 1. profiles: 역할 모델 수정 + 추가 컬럼
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists notification_preferences jsonb default '{"order_email":true,"order_push":true,"message_email":true,"message_push":true,"review_email":false,"review_push":true,"promo_email":false,"promo_push":false}';
alter table public.profiles add column if not exists marketing_agreed boolean default false;
alter table public.profiles add column if not exists deleted_at timestamptz;

-- 2. experts: 경력 + 포트폴리오
alter table public.experts add column if not exists experience text;
alter table public.experts add column if not exists portfolio_links text[] default '{}';

-- 3. services: 조회수 + 영상URL
alter table public.services add column if not exists view_count int default 0;
alter table public.services add column if not exists video_url text;

-- 4. orders: 결제수단 + 쿠폰 + 수정/납품 횟수
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists coupon_id uuid;
alter table public.orders add column if not exists revision_count int default 0;
alter table public.orders add column if not exists delivery_count int default 0;

-- 5. reviews: 전문가 답변
alter table public.reviews add column if not exists reply text;
alter table public.reviews add column if not exists reply_at timestamptz;

-- 6. categories: 서비스 카운트
alter table public.categories add column if not exists service_count int default 0;

-- 7. events: 이미지 + 뱃지
alter table public.events add column if not exists image_url text;
alter table public.events add column if not exists badge text;

-- 8. conversations: 읽지않은 수
alter table public.conversations add column if not exists unread_count_buyer int default 0;
alter table public.conversations add column if not exists unread_count_seller int default 0;


-- ===== B. 새 테이블 9개 =====

-- 1. 결제 기록
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  method text not null check (method in ('card', 'kakao', 'naver', 'bank', 'other')),
  pg_transaction_id text,
  pg_provider text,
  amount int not null,
  status text default 'pending' check (status in ('pending', 'completed', 'failed', 'cancelled', 'refunded', 'partial_refunded')),
  refund_amount int default 0,
  refund_reason text,
  paid_at timestamptz,
  refunded_at timestamptz,
  raw_response jsonb,
  created_at timestamptz default now()
);

-- 2. 주문 상태 이력
create table if not exists public.order_status_history (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id),
  note text,
  created_at timestamptz default now()
);

-- 3. 납품물 (시안/최종)
create table if not exists public.order_deliveries (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  delivery_type text not null check (delivery_type in ('draft', 'revision', 'final', 'requirements')),
  message text,
  files jsonb default '[]',
  created_at timestamptz default now()
);

-- 4. 유저별 쿠폰
create table if not exists public.user_coupons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  coupon_id uuid references public.coupons(id) on delete cascade not null,
  is_used boolean default false,
  used_at timestamptz,
  order_id uuid references public.orders(id),
  created_at timestamptz default now(),
  unique(user_id, coupon_id)
);

-- 5. 최근 본 서비스
create table if not exists public.browsing_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  viewed_at timestamptz default now()
);
-- 최근 본 서비스 중복 방지: 같은 서비스를 다시 보면 시간만 업데이트
create unique index if not exists idx_browsing_history_unique on public.browsing_history(user_id, service_id);

-- 6. 전문가 정산 계좌
create table if not exists public.expert_bank_accounts (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid references public.experts(id) on delete cascade unique not null,
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  tax_type text default '개인' check (tax_type in ('개인', '개인사업자', '법인사업자')),
  business_number text,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. 전문가 등록 신청
create table if not exists public.expert_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text not null,
  phone text,
  category_id text references public.categories(id),
  introduction text,
  skills text[] default '{}',
  experience text,
  portfolio_links text[] default '{}',
  status text default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected')),
  reviewer_id uuid references public.profiles(id),
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- 8. 신고
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) not null,
  target_type text not null check (target_type in ('service', 'review', 'expert', 'message', 'user')),
  target_id uuid not null,
  reason text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolver_id uuid references public.profiles(id),
  resolver_note text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- 9. 관리자 활동 로그
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references public.profiles(id) not null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);


-- ===== C. orders.coupon_id FK =====
-- user_coupons 테이블 생성 후 FK 추가
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'orders_coupon_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_coupon_id_fkey
      foreign key (coupon_id) references public.user_coupons(id);
  end if;
end $$;


-- ===== D. 트리거 추가 =====

-- 주문 상태 변경 시 자동 이력 기록
create or replace function public.log_order_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history (order_id, from_status, to_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  after update of status on public.orders
  for each row execute procedure public.log_order_status_change();

-- 서비스 생성/삭제 시 카테고리 카운트 업데이트
create or replace function public.update_category_service_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and new.status = 'active' then
    update public.categories set service_count = service_count + 1 where id = new.category_id;
  elsif TG_OP = 'DELETE' and old.status = 'active' then
    update public.categories set service_count = service_count - 1 where id = old.category_id;
  elsif TG_OP = 'UPDATE' then
    if old.status != 'active' and new.status = 'active' then
      update public.categories set service_count = service_count + 1 where id = new.category_id;
    elsif old.status = 'active' and new.status != 'active' then
      update public.categories set service_count = service_count - 1 where id = old.category_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists on_service_count_change on public.services;
create trigger on_service_count_change
  after insert or update of status or delete on public.services
  for each row execute procedure public.update_category_service_count();

-- expert_bank_accounts updated_at
create trigger update_bank_accounts_updated_at before update on public.expert_bank_accounts
  for each row execute procedure public.update_updated_at();


-- ===== E. RLS 정책 전면 재작성 =====

-- 새 테이블 RLS 활성화
alter table public.payments enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_deliveries enable row level security;
alter table public.user_coupons enable row level security;
alter table public.browsing_history enable row level security;
alter table public.expert_bank_accounts enable row level security;
alter table public.expert_applications enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

-- 기존 정책 삭제 (재생성)
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- ---- 공개 읽기 ----
create policy "anyone_read_categories" on public.categories for select using (true);
create policy "anyone_read_active_services" on public.services for select using (status = 'active');
create policy "anyone_read_packages" on public.service_packages for select using (true);
create policy "anyone_read_experts" on public.experts for select using (true);
create policy "anyone_read_public_reviews" on public.reviews for select using (is_public = true);
create policy "anyone_read_active_events" on public.events for select using (true);
create policy "anyone_read_active_coupons" on public.coupons for select using (is_active = true);
-- profiles: 이름/아바타만 공개 (전체 공개 읽기 허용, 민감 정보는 프론트에서 필터)
create policy "anyone_read_profiles" on public.profiles for select using (true);

-- ---- 인증 사용자: 읽기 ----
create policy "auth_read_own_orders" on public.orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "auth_read_own_convos" on public.conversations for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "auth_read_own_messages" on public.messages for select using (
  conversation_id in (select id from public.conversations where buyer_id = auth.uid() or seller_id = auth.uid())
);
create policy "auth_read_own_favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "auth_read_own_notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "auth_read_own_settlements" on public.settlements for select using (auth.uid() = expert_id);
create policy "auth_read_own_payments" on public.payments for select using (auth.uid() = user_id);
create policy "auth_read_own_order_history" on public.order_status_history for select using (
  order_id in (select id from public.orders where buyer_id = auth.uid() or seller_id = auth.uid())
);
create policy "auth_read_own_deliveries" on public.order_deliveries for select using (
  order_id in (select id from public.orders where buyer_id = auth.uid() or seller_id = auth.uid())
);
create policy "auth_read_own_coupons" on public.user_coupons for select using (auth.uid() = user_id);
create policy "auth_read_own_history" on public.browsing_history for select using (auth.uid() = user_id);
create policy "auth_read_own_bank" on public.expert_bank_accounts for select using (auth.uid() = expert_id);
create policy "auth_read_own_applications" on public.expert_applications for select using (auth.uid() = user_id);
create policy "auth_read_own_tickets" on public.support_tickets for select using (auth.uid() = user_id);
create policy "auth_read_own_ticket_msgs" on public.support_messages for select using (
  ticket_id in (select id from public.support_tickets where user_id = auth.uid())
);
create policy "auth_read_own_quote_requests" on public.quote_requests for select using (auth.uid() = requester_id);
create policy "auth_read_own_quotes" on public.quotes for select using (auth.uid() = expert_id);
-- 전문가는 공개 견적 요청도 볼 수 있음
create policy "expert_read_open_requests" on public.quote_requests for select using (status = 'open');

-- ---- 인증 사용자: 쓰기 (INSERT) ----
create policy "auth_insert_orders" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "auth_insert_messages" on public.messages for insert with check (
  auth.uid() = sender_id and conversation_id in (
    select id from public.conversations where buyer_id = auth.uid() or seller_id = auth.uid()
  )
);
create policy "auth_insert_reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);
create policy "auth_insert_favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "auth_delete_favorites" on public.favorites for delete using (auth.uid() = user_id);
create policy "auth_insert_notifications" on public.notifications for insert with check (true); -- 시스템/트리거에서도 생성
create policy "auth_insert_convos" on public.conversations for insert with check (auth.uid() = buyer_id);
create policy "auth_insert_quote_requests" on public.quote_requests for insert with check (auth.uid() = requester_id);
create policy "auth_insert_quotes" on public.quotes for insert with check (auth.uid() = expert_id);
create policy "auth_insert_tickets" on public.support_tickets for insert with check (auth.uid() = user_id);
create policy "auth_insert_ticket_msgs" on public.support_messages for insert with check (
  auth.uid() = sender_id and ticket_id in (select id from public.support_tickets where user_id = auth.uid())
);
create policy "auth_insert_payments" on public.payments for insert with check (auth.uid() = user_id);
create policy "auth_insert_deliveries" on public.order_deliveries for insert with check (auth.uid() = sender_id);
create policy "auth_insert_history" on public.browsing_history for insert with check (auth.uid() = user_id);
create policy "auth_insert_reports" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "auth_insert_applications" on public.expert_applications for insert with check (auth.uid() = user_id);

-- ---- 인증 사용자: 수정 (UPDATE) ----
create policy "auth_update_own_profile" on public.profiles for update using (auth.uid() = id);
create policy "auth_update_own_expert" on public.experts for update using (auth.uid() = id);
create policy "auth_update_own_notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "auth_update_own_history" on public.browsing_history for update using (auth.uid() = user_id);
create policy "auth_delete_own_history" on public.browsing_history for delete using (auth.uid() = user_id);

-- 전문가: 자기 서비스 관리
create policy "expert_manage_own_services" on public.services for all using (auth.uid() = expert_id);
create policy "expert_manage_own_packages" on public.service_packages for all using (
  service_id in (select id from public.services where expert_id = auth.uid())
);
create policy "expert_manage_own_bank" on public.expert_bank_accounts for all using (auth.uid() = expert_id);
-- 전문가: 리뷰에 답변
create policy "expert_reply_reviews" on public.reviews for update using (auth.uid() = expert_id);

-- ---- 관리자: 전체 접근 ----
create policy "admin_all_profiles" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_orders" on public.orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_services" on public.services for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_experts" on public.experts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_reviews" on public.reviews for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_settlements" on public.settlements for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_events" on public.events for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_coupons" on public.coupons for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_categories" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_tickets" on public.support_tickets for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_ticket_msgs" on public.support_messages for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_applications" on public.expert_applications for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_reports" on public.reports for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_all_audit_logs" on public.audit_logs for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "admin_insert_audit_logs" on public.audit_logs for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);


-- ===== F. 인덱스 (성능) =====

create index if not exists idx_services_category on public.services(category_id);
create index if not exists idx_services_expert on public.services(expert_id);
create index if not exists idx_services_status on public.services(status);
create index if not exists idx_services_created on public.services(created_at desc);
create index if not exists idx_orders_buyer on public.orders(buyer_id);
create index if not exists idx_orders_seller on public.orders(seller_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);
create index if not exists idx_reviews_service on public.reviews(service_id);
create index if not exists idx_reviews_expert on public.reviews(expert_id);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_order_history_order on public.order_status_history(order_id, created_at);
create index if not exists idx_deliveries_order on public.order_deliveries(order_id, created_at);
create index if not exists idx_browsing_user on public.browsing_history(user_id, viewed_at desc);
create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_settlements_expert on public.settlements(expert_id);
create index if not exists idx_quote_requests_status on public.quote_requests(status);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_applications_status on public.expert_applications(status);


-- ===== G. 프로필 트리거 업데이트 (is_admin 포함) =====

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    false
  );
  return new;
end;
$$ language plpgsql security definer;

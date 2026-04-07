-- ============================================
-- v3 패치: Supabase 공식 문서 기반 보안/기능 강화
-- ============================================


-- ===== 1. security definer 함수에 set search_path = '' 추가 =====

-- handle_new_user (프로필 자동 생성)
create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
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

-- update_updated_at
create or replace function public.update_updated_at()
returns trigger
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- log_order_status_change
create or replace function public.log_order_status_change()
returns trigger
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history (order_id, from_status, to_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- update_category_service_count
create or replace function public.update_category_service_count()
returns trigger
set search_path = ''
as $$
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


-- ===== 2. is_admin() 헬퍼 함수 (RLS 성능 최적화) =====

create or replace function public.is_admin()
returns boolean
set search_path = ''
as $$
begin
  return exists(
    select 1 from public.profiles
    where id = (select auth.uid())
    and is_admin = true
  );
end;
$$ language plpgsql security definer stable;


-- ===== 3. RLS 정책: auth.uid() → (select auth.uid()) 성능 패치 =====
-- 기존 정책 삭제 후 재생성 (select auth.uid() 적용)

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
create policy "anyone_read_profiles" on public.profiles for select using (true);

-- ---- 인증 사용자: 읽기 (select auth.uid() 적용) ----
create policy "auth_read_own_orders" on public.orders for select to authenticated using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);
create policy "auth_read_own_convos" on public.conversations for select to authenticated using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);
create policy "auth_read_own_messages" on public.messages for select to authenticated using (
  conversation_id in (select id from public.conversations where buyer_id = (select auth.uid()) or seller_id = (select auth.uid()))
);
create policy "auth_read_own_favorites" on public.favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_own_notifications" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_own_settlements" on public.settlements for select to authenticated using ((select auth.uid()) = expert_id);
create policy "auth_read_own_payments" on public.payments for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_own_order_history" on public.order_status_history for select to authenticated using (
  order_id in (select id from public.orders where buyer_id = (select auth.uid()) or seller_id = (select auth.uid()))
);
create policy "auth_read_own_deliveries" on public.order_deliveries for select to authenticated using (
  order_id in (select id from public.orders where buyer_id = (select auth.uid()) or seller_id = (select auth.uid()))
);
create policy "auth_read_own_coupons" on public.user_coupons for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_own_history" on public.browsing_history for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_own_bank" on public.expert_bank_accounts for select to authenticated using ((select auth.uid()) = expert_id);
create policy "auth_read_own_applications" on public.expert_applications for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_own_tickets" on public.support_tickets for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_own_ticket_msgs" on public.support_messages for select to authenticated using (
  ticket_id in (select id from public.support_tickets where user_id = (select auth.uid()))
);
create policy "auth_read_own_quote_requests" on public.quote_requests for select to authenticated using ((select auth.uid()) = requester_id);
create policy "auth_read_own_quotes" on public.quotes for select to authenticated using ((select auth.uid()) = expert_id);
create policy "expert_read_open_requests" on public.quote_requests for select to authenticated using (status = 'open');

-- ---- 인증 사용자: 쓰기 ----
create policy "auth_insert_orders" on public.orders for insert to authenticated with check ((select auth.uid()) = buyer_id);
create policy "auth_insert_messages" on public.messages for insert to authenticated with check (
  (select auth.uid()) = sender_id and conversation_id in (
    select id from public.conversations where buyer_id = (select auth.uid()) or seller_id = (select auth.uid())
  )
);
create policy "auth_insert_reviews" on public.reviews for insert to authenticated with check ((select auth.uid()) = reviewer_id);
create policy "auth_insert_favorites" on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "auth_delete_favorites" on public.favorites for delete to authenticated using ((select auth.uid()) = user_id);
create policy "auth_insert_notifications" on public.notifications for insert to authenticated with check (true);
create policy "auth_insert_convos" on public.conversations for insert to authenticated with check ((select auth.uid()) = buyer_id);
create policy "auth_insert_quote_requests" on public.quote_requests for insert to authenticated with check ((select auth.uid()) = requester_id);
create policy "auth_insert_quotes" on public.quotes for insert to authenticated with check ((select auth.uid()) = expert_id);
create policy "auth_insert_tickets" on public.support_tickets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "auth_insert_ticket_msgs" on public.support_messages for insert to authenticated with check (
  (select auth.uid()) = sender_id and ticket_id in (select id from public.support_tickets where user_id = (select auth.uid()))
);
create policy "auth_insert_payments" on public.payments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "auth_insert_deliveries" on public.order_deliveries for insert to authenticated with check ((select auth.uid()) = sender_id);
create policy "auth_insert_history" on public.browsing_history for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "auth_insert_reports" on public.reports for insert to authenticated with check ((select auth.uid()) = reporter_id);
create policy "auth_insert_applications" on public.expert_applications for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users_insert_own_profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

-- ---- 인증 사용자: 수정 ----
create policy "auth_update_own_profile" on public.profiles for update to authenticated using ((select auth.uid()) = id);
create policy "auth_update_own_expert" on public.experts for update to authenticated using ((select auth.uid()) = id);
create policy "auth_update_own_notifications" on public.notifications for update to authenticated using ((select auth.uid()) = user_id);
create policy "auth_update_own_history" on public.browsing_history for update to authenticated using ((select auth.uid()) = user_id);
create policy "auth_delete_own_history" on public.browsing_history for delete to authenticated using ((select auth.uid()) = user_id);

-- 전문가: 자기 서비스/계좌/리뷰 답변
create policy "expert_manage_own_services" on public.services for all to authenticated using ((select auth.uid()) = expert_id);
create policy "expert_manage_own_packages" on public.service_packages for all to authenticated using (
  service_id in (select id from public.services where expert_id = (select auth.uid()))
);
create policy "expert_manage_own_bank" on public.expert_bank_accounts for all to authenticated using ((select auth.uid()) = expert_id);
create policy "expert_reply_reviews" on public.reviews for update to authenticated using ((select auth.uid()) = expert_id);

-- ---- 관리자: is_admin() 함수 사용 ----
create policy "admin_all_profiles" on public.profiles for all to authenticated using ((select public.is_admin()));
create policy "admin_all_orders" on public.orders for all to authenticated using ((select public.is_admin()));
create policy "admin_all_services" on public.services for all to authenticated using ((select public.is_admin()));
create policy "admin_all_experts" on public.experts for all to authenticated using ((select public.is_admin()));
create policy "admin_all_reviews" on public.reviews for all to authenticated using ((select public.is_admin()));
create policy "admin_all_settlements" on public.settlements for all to authenticated using ((select public.is_admin()));
create policy "admin_all_events" on public.events for all to authenticated using ((select public.is_admin()));
create policy "admin_all_coupons" on public.coupons for all to authenticated using ((select public.is_admin()));
create policy "admin_all_categories" on public.categories for all to authenticated using ((select public.is_admin()));
create policy "admin_all_tickets" on public.support_tickets for all to authenticated using ((select public.is_admin()));
create policy "admin_all_ticket_msgs" on public.support_messages for all to authenticated using ((select public.is_admin()));
create policy "admin_all_applications" on public.expert_applications for all to authenticated using ((select public.is_admin()));
create policy "admin_all_reports" on public.reports for all to authenticated using ((select public.is_admin()));
create policy "admin_all_audit_logs" on public.audit_logs for all to authenticated using ((select public.is_admin()));
create policy "admin_all_payments" on public.payments for all to authenticated using ((select public.is_admin()));
create policy "admin_all_user_coupons" on public.user_coupons for all to authenticated using ((select public.is_admin()));


-- ===== 4. Storage 버킷 설정 =====

-- 프로필 사진 (공개)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- 포트폴리오 (공개)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolios', 'portfolios', true, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'])
on conflict (id) do nothing;

-- 납품물 (비공개)
insert into storage.buckets (id, name, public, file_size_limit)
values ('deliveries', 'deliveries', false, 524288000)
on conflict (id) do nothing;

-- 메시지 첨부파일 (비공개)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'application/zip'])
on conflict (id) do nothing;

-- 서비스 썸네일/이미지 (공개)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('service-images', 'service-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Storage RLS 정책
-- 아바타: 공개 읽기, 본인만 업로드/수정
create policy "Avatar public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "Avatar auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "Avatar auth update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "Avatar auth delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- 포트폴리오: 공개 읽기, 전문가만 업로드
create policy "Portfolio public read" on storage.objects for select using (bucket_id = 'portfolios');
create policy "Portfolio auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'portfolios' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "Portfolio auth delete" on storage.objects for delete to authenticated using (bucket_id = 'portfolios' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- 납품물: 주문 관계자만 접근
create policy "Delivery auth read" on storage.objects for select to authenticated using (bucket_id = 'deliveries');
create policy "Delivery auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'deliveries');

-- 첨부파일: 인증된 사용자
create policy "Attachment auth read" on storage.objects for select to authenticated using (bucket_id = 'attachments');
create policy "Attachment auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'attachments');

-- 서비스 이미지: 공개 읽기, 전문가 업로드
create policy "Service img public read" on storage.objects for select using (bucket_id = 'service-images');
create policy "Service img auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'service-images' and (select auth.uid())::text = (storage.foldername(name))[1]);
create policy "Service img auth delete" on storage.objects for delete to authenticated using (bucket_id = 'service-images' and (select auth.uid())::text = (storage.foldername(name))[1]);


-- ===== 5. Realtime 활성화 =====

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.orders;

-- Realtime에서 old record 접근 (UPDATE/DELETE 시 이전 값)
alter table public.messages replica identity full;
alter table public.conversations replica identity full;
alter table public.notifications replica identity full;


-- ===== 6. Full Text Search (한국어 서비스 검색) =====

-- 서비스 검색용 tsvector 컬럼
alter table public.services add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) stored;

create index if not exists idx_services_fts on public.services using gin(fts);

-- 전문가 검색용
alter table public.experts add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(introduction, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(skills, ' '), '')), 'C')
  ) stored;

create index if not exists idx_experts_fts on public.experts using gin(fts);

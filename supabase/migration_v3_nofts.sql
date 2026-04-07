-- v3 패치 (FTS 제외): 보안 함수 + RLS + Storage + Realtime

-- ===== 1. security definer 함수에 set search_path = '' =====
create or replace function public.handle_new_user()
returns trigger set search_path = '' as $$
begin
  insert into public.profiles (id, name, email, avatar_url, is_admin)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email, new.raw_user_meta_data->>'avatar_url', false);
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.update_updated_at()
returns trigger set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql security definer;

create or replace function public.log_order_status_change()
returns trigger set search_path = '' as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history (order_id, from_status, to_status) values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- ===== 2. is_admin() 헬퍼 함수 =====
create or replace function public.is_admin()
returns boolean set search_path = '' as $$
begin
  return exists(select 1 from public.profiles where id = (select auth.uid()) and is_admin = true);
end;
$$ language plpgsql security definer stable;

-- ===== 3. RLS 재작성 (select auth.uid()) =====
do $$ declare pol record; begin
  for pol in select policyname, tablename from pg_policies where schemaname = 'public'
  loop execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename); end loop;
end $$;

-- 공개
create policy "anyone_read_categories" on public.categories for select using (true);
create policy "anyone_read_active_services" on public.services for select using (status = 'active');
create policy "anyone_read_packages" on public.service_packages for select using (true);
create policy "anyone_read_experts" on public.experts for select using (true);
create policy "anyone_read_public_reviews" on public.reviews for select using (is_public = true);
create policy "anyone_read_events" on public.events for select using (true);
create policy "anyone_read_coupons" on public.coupons for select using (is_active = true);
create policy "anyone_read_profiles" on public.profiles for select using (true);

-- 인증 읽기
create policy "auth_read_orders" on public.orders for select to authenticated using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);
create policy "auth_read_convos" on public.conversations for select to authenticated using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);
create policy "auth_read_messages" on public.messages for select to authenticated using (conversation_id in (select id from public.conversations where buyer_id = (select auth.uid()) or seller_id = (select auth.uid())));
create policy "auth_read_favorites" on public.favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_notifications" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_settlements" on public.settlements for select to authenticated using ((select auth.uid()) = expert_id);
create policy "auth_read_payments" on public.payments for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_order_history" on public.order_status_history for select to authenticated using (order_id in (select id from public.orders where buyer_id = (select auth.uid()) or seller_id = (select auth.uid())));
create policy "auth_read_deliveries" on public.order_deliveries for select to authenticated using (order_id in (select id from public.orders where buyer_id = (select auth.uid()) or seller_id = (select auth.uid())));
create policy "auth_read_user_coupons" on public.user_coupons for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_history" on public.browsing_history for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_bank" on public.expert_bank_accounts for select to authenticated using ((select auth.uid()) = expert_id);
create policy "auth_read_applications" on public.expert_applications for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_tickets" on public.support_tickets for select to authenticated using ((select auth.uid()) = user_id);
create policy "auth_read_ticket_msgs" on public.support_messages for select to authenticated using (ticket_id in (select id from public.support_tickets where user_id = (select auth.uid())));
create policy "auth_read_quote_req" on public.quote_requests for select to authenticated using ((select auth.uid()) = requester_id);
create policy "auth_read_quotes" on public.quotes for select to authenticated using ((select auth.uid()) = expert_id);
create policy "expert_read_open_req" on public.quote_requests for select to authenticated using (status = 'open');

-- 인증 쓰기
create policy "auth_insert_orders" on public.orders for insert to authenticated with check ((select auth.uid()) = buyer_id);
create policy "auth_insert_messages" on public.messages for insert to authenticated with check ((select auth.uid()) = sender_id);
create policy "auth_insert_reviews" on public.reviews for insert to authenticated with check ((select auth.uid()) = reviewer_id);
create policy "auth_insert_favorites" on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "auth_delete_favorites" on public.favorites for delete to authenticated using ((select auth.uid()) = user_id);
create policy "auth_insert_notifications" on public.notifications for insert to authenticated with check (true);
create policy "auth_insert_convos" on public.conversations for insert to authenticated with check ((select auth.uid()) = buyer_id);
create policy "auth_insert_quote_req" on public.quote_requests for insert to authenticated with check ((select auth.uid()) = requester_id);
create policy "auth_insert_quotes" on public.quotes for insert to authenticated with check ((select auth.uid()) = expert_id);
create policy "auth_insert_tickets" on public.support_tickets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "auth_insert_ticket_msgs" on public.support_messages for insert to authenticated with check ((select auth.uid()) = sender_id);
create policy "auth_insert_payments" on public.payments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "auth_insert_deliveries" on public.order_deliveries for insert to authenticated with check ((select auth.uid()) = sender_id);
create policy "auth_insert_browsing" on public.browsing_history for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "auth_insert_reports" on public.reports for insert to authenticated with check ((select auth.uid()) = reporter_id);
create policy "auth_insert_applications" on public.expert_applications for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users_insert_profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

-- 인증 수정
create policy "auth_update_profile" on public.profiles for update to authenticated using ((select auth.uid()) = id);
create policy "auth_update_expert" on public.experts for update to authenticated using ((select auth.uid()) = id);
create policy "auth_update_notifications" on public.notifications for update to authenticated using ((select auth.uid()) = user_id);
create policy "auth_update_browsing" on public.browsing_history for update to authenticated using ((select auth.uid()) = user_id);
create policy "auth_delete_browsing" on public.browsing_history for delete to authenticated using ((select auth.uid()) = user_id);
create policy "expert_manage_services" on public.services for all to authenticated using ((select auth.uid()) = expert_id);
create policy "expert_manage_packages" on public.service_packages for all to authenticated using (service_id in (select id from public.services where expert_id = (select auth.uid())));
create policy "expert_manage_bank" on public.expert_bank_accounts for all to authenticated using ((select auth.uid()) = expert_id);
create policy "expert_reply_reviews" on public.reviews for update to authenticated using ((select auth.uid()) = expert_id);

-- 관리자
create policy "admin_profiles" on public.profiles for all to authenticated using ((select public.is_admin()));
create policy "admin_orders" on public.orders for all to authenticated using ((select public.is_admin()));
create policy "admin_services" on public.services for all to authenticated using ((select public.is_admin()));
create policy "admin_experts" on public.experts for all to authenticated using ((select public.is_admin()));
create policy "admin_reviews" on public.reviews for all to authenticated using ((select public.is_admin()));
create policy "admin_settlements" on public.settlements for all to authenticated using ((select public.is_admin()));
create policy "admin_events" on public.events for all to authenticated using ((select public.is_admin()));
create policy "admin_coupons" on public.coupons for all to authenticated using ((select public.is_admin()));
create policy "admin_categories" on public.categories for all to authenticated using ((select public.is_admin()));
create policy "admin_tickets" on public.support_tickets for all to authenticated using ((select public.is_admin()));
create policy "admin_ticket_msgs" on public.support_messages for all to authenticated using ((select public.is_admin()));
create policy "admin_applications" on public.expert_applications for all to authenticated using ((select public.is_admin()));
create policy "admin_reports" on public.reports for all to authenticated using ((select public.is_admin()));
create policy "admin_audit_logs" on public.audit_logs for all to authenticated using ((select public.is_admin()));
create policy "admin_payments" on public.payments for all to authenticated using ((select public.is_admin()));
create policy "admin_user_coupons" on public.user_coupons for all to authenticated using ((select public.is_admin()));

-- ===== 4. Storage 버킷 =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif']) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('portfolios', 'portfolios', true, 52428800, array['image/png','image/jpeg','image/webp','video/mp4','video/webm','application/pdf']) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit) values ('deliveries', 'deliveries', false, 524288000) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('attachments', 'attachments', false, 10485760, array['image/png','image/jpeg','image/webp','application/pdf','application/zip']) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('service-images', 'service-images', true, 5242880, array['image/png','image/jpeg','image/webp']) on conflict (id) do nothing;

-- Storage RLS
create policy "Avatar public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "Avatar auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');
create policy "Portfolio public read" on storage.objects for select using (bucket_id = 'portfolios');
create policy "Portfolio auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'portfolios');
create policy "Delivery auth read" on storage.objects for select to authenticated using (bucket_id = 'deliveries');
create policy "Delivery auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'deliveries');
create policy "Attachment auth read" on storage.objects for select to authenticated using (bucket_id = 'attachments');
create policy "Attachment auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'attachments');
create policy "Svc img public read" on storage.objects for select using (bucket_id = 'service-images');
create policy "Svc img auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'service-images');

-- ===== 5. Realtime =====
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.orders;
alter table public.messages replica identity full;
alter table public.conversations replica identity full;
alter table public.notifications replica identity full;

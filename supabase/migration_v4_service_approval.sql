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

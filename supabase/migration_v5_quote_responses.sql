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

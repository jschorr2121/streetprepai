-- 001_ai_usage.sql
-- Persist AI token usage + cost per call for monthly quota enforcement.
-- user_id is nullable: callers that haven't been swept to pass the user yet
-- still log the row (cost is real even if we can't attribute it).

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_write_tokens int not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_month_idx
  on public.ai_usage (user_id, created_at desc);
create index if not exists ai_usage_created_idx
  on public.ai_usage (created_at desc);

-- RLS: users can read their own; service role can insert anything.
alter table public.ai_usage enable row level security;

create policy ai_usage_user_read on public.ai_usage
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy — only the service-role client (which
-- bypasses RLS) writes.

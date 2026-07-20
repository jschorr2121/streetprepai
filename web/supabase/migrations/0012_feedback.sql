-- Lightweight in-app feedback widget: one row per submission, owned by the
-- submitting user. No admin UI yet — rows are read via Supabase directly
-- until a triage view exists.

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  route      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;
do $$ begin
  create policy feedback_owner on public.feedback
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

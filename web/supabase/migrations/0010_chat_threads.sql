-- Unit 9 (chatbot rebuild), issue 01: standalone assistant chat threads.
-- `chat_messages.content` holds the AI SDK UIMessage `parts` array so later
-- tool-call parts (issue 02) persist without a schema change.

create table if not exists public.chat_threads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_threads_user_updated_idx
  on public.chat_threads (user_id, updated_at desc);

alter table public.chat_threads enable row level security;
do $$ begin
  create policy chat_threads_owner on public.chat_threads
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  -- seq gives a total order within a thread; created_at ties within a single
  -- batched insert (user + assistant rows share one now()).
  seq        bigint generated always as identity,
  thread_id  uuid not null references public.chat_threads (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_seq_idx
  on public.chat_messages (thread_id, seq);

alter table public.chat_messages enable row level security;
do $$ begin
  create policy chat_messages_owner on public.chat_messages
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

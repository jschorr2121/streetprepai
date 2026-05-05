-- Wave 5: pgvector-backed semantic recall for chat summaries.
--
-- Enables the pgvector extension and creates a `chat_embeddings` table that
-- stores one OpenAI text-embedding-3-small vector per chat-summary. Embeddings
-- are over the AI-distilled summary text (topics + advice + commitments +
-- personal details + follow-ups), NOT raw notes — so the vector aligns with
-- the high-signal recall use case ("what did we discuss") rather than verbose
-- prose noise.
--
-- Apply order vs index: ivfflat performs best when the table has rows before
-- the index is built. For the first deployment, run this migration's table
-- DDL, then `pnpm backfill:embeddings`, then re-run this migration so the
-- `create index if not exists` lines actually build the index against rows.
-- (`if not exists` makes both runs idempotent.)

create extension if not exists vector;

-- One row per chat-summary embedding. `chat_id` and `contact_id` match the
-- existing `text` PK types in scripts/schema.sql (chats.id text, contacts.id
-- text). FK to chats.id with ON DELETE CASCADE so removing a chat removes its
-- embedding.
create table if not exists public.chat_embeddings (
  chat_id       text primary key references public.chats(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  contact_id    text not null references public.contacts(id) on delete cascade,
  embedding     vector(1536) not null,
  summary_text  text not null,
  created_at    timestamptz not null default now()
);

create index if not exists chat_embeddings_user_contact_idx
  on public.chat_embeddings (user_id, contact_id);

-- IVFFlat for cosine similarity. lists=100 is reasonable up to ~1M rows;
-- tune as data grows.
create index if not exists chat_embeddings_cosine_idx
  on public.chat_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RLS: a user can read only their own embeddings. Service-role client (which
-- bypasses RLS) handles all writes from the structure-chat route + backfill.
alter table public.chat_embeddings enable row level security;

drop policy if exists "chat_embeddings_user_read" on public.chat_embeddings;
create policy "chat_embeddings_user_read" on public.chat_embeddings
  for select using (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- RPC: top-k cosine-similar past chats for a user, optionally scoped to a
-- single contact. Used by lib/data/semantic-recall.ts.
-- ──────────────────────────────────────────────
create or replace function public.match_chat_embeddings(
  user_id_in       uuid,
  contact_id_in    text,
  query_embedding  vector(1536),
  match_count      int default 3
)
returns table (
  chat_id       text,
  contact_id    text,
  summary_text  text,
  distance      float
)
language sql
stable
as $$
  select
    e.chat_id,
    e.contact_id,
    e.summary_text,
    (e.embedding <=> query_embedding)::float as distance
  from public.chat_embeddings e
  where e.user_id = user_id_in
    and (contact_id_in is null or e.contact_id = contact_id_in)
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

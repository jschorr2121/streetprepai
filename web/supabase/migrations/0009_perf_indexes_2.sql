-- Perf pass 2: covering composites for the two sorted reads that lacked one,
-- removal of single-column indexes strictly superseded by a composite with the
-- same leading column(s), and better ANN recall on semantic chat search.
--
-- Idempotent: `if not exists` / `if exists` throughout; the function is
-- `create or replace`. Safe to run more than once.

-- ──────────────────────────────────────────────
-- New covering indexes
-- ──────────────────────────────────────────────

-- getChatLogsForContact: WHERE user_id = ? AND contact_id = ? ORDER BY
-- happened_at DESC. The old (user_id, contact_id) index satisfied the filter
-- but forced a sort; this one hands rows back already ordered.
create index if not exists chats_user_contact_happened_idx
  on public.chats (user_id, contact_id, happened_at desc);

-- getApplications with a stage filter: WHERE user_id = ? AND stage = ?
-- ORDER BY added_at DESC.
create index if not exists applied_jobs_user_stage_added_idx
  on public.applied_jobs (user_id, stage, added_at desc);

-- ──────────────────────────────────────────────
-- Drop superseded indexes (each is a strict prefix of a composite that
-- already exists, so every query the dropped index could serve is served —
-- equally or better — by the composite; keeping both only taxes writes).
-- chats_contact_idx stays: it is the FK-support index for contact deletes.
-- followups_user_idx stays: the only composite on followups is partial.
-- ──────────────────────────────────────────────

drop index if exists public.chats_user_contact_idx;       -- prefix of chats_user_contact_happened_idx
drop index if exists public.applied_jobs_user_stage_idx;  -- prefix of applied_jobs_user_stage_added_idx
drop index if exists public.contacts_user_idx;            -- prefix of contacts_user_name_idx
drop index if exists public.chats_user_idx;               -- prefix of chats_user_happened_idx
drop index if exists public.calendar_user_idx;            -- prefix of calendar_user_starts_idx
drop index if exists public.applied_jobs_user_idx;        -- prefix of applied_jobs_user_added_idx
drop index if exists public.mock_interviews_user_idx;     -- prefix of mock_interviews_user_created_idx
drop index if exists public.stories_user_idx;             -- prefix of stories_user_created_idx
drop index if exists public.guide_progress_user_idx;      -- prefix of guide_progress_user_slug_unique
drop index if exists public.section_progress_user_idx;    -- prefix of the (user_id, chapter_slug, section_slug) PK

-- ──────────────────────────────────────────────
-- Semantic recall: raise IVFFlat probes for match_chat_embeddings.
--
-- The index was built with lists = 100, and the RPC ran at the default
-- ivfflat.probes = 1 — a single probed list, so per-user/per-contact filtered
-- searches could miss matches that live in unprobed lists. probes = 10
-- (~sqrt(lists)) is the standard recall/latency tradeoff. The SET clause
-- scopes the GUC to the function invocation only.
-- ──────────────────────────────────────────────

create or replace function public.match_chat_embeddings(
  user_id_in       uuid,
  contact_id_in    text,
  query_embedding  extensions.vector(1536),
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
set search_path = public, extensions
set ivfflat.probes = 10
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

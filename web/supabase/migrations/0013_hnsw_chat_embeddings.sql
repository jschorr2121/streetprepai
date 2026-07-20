-- 0013 — Swap chat_embeddings' vector index from IVFFlat to HNSW.
--
-- Why (launch-readiness brainstorm 2026-07-19 §2.5): IVFFlat builds cluster
-- centroids from the rows present at index-build time. At launch the table is
-- near-empty, so organic one-row-at-a-time growth trains the centroids on a
-- thin, unrepresentative sample and they never re-balance without a manual
-- reindex. HNSW has no training step — it builds its graph incrementally, so
-- recall holds up as the table grows from zero. The 0009 probes=10 mitigation
-- becomes moot (hnsw ignores ivfflat.probes; the GUC is dropped from the RPC).
--
-- Cost note: HNSW builds are slower and the index is larger than IVFFlat, but
-- at launch-scale row counts (hundreds to low thousands) both are trivial.
-- Doing the swap NOW, while the table is small, is the whole point — a rebuild
-- later is the expensive path.
--
-- Idempotent: both statements guard on existence; safe to re-run.

-- 1) Replace the index. m/ef_construction are pgvector's defaults (16/64),
--    stated explicitly so a future tune has a baseline to diff against.
drop index if exists public.chat_embeddings_cosine_idx;

create index if not exists chat_embeddings_cosine_hnsw_idx
  on public.chat_embeddings using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- 2) Recreate match_chat_embeddings without the ivfflat.probes GUC (harmless
--    under HNSW but misleading). Body otherwise identical to 0009's version.
--    hnsw.ef_search's default (40) comfortably exceeds match_count (3).
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

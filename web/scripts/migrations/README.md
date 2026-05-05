# Migrations

Numbered SQL migrations for the Supabase database. The prototype does not
auto-apply these — apply them manually in the Supabase SQL editor in
numerical order. Wave 7 will adopt the Supabase CLI and a real
migration runner.

## How to apply

1. Open the Supabase project's SQL editor.
2. Pick the next un-applied file in this directory (lowest numerical
   prefix that isn't yet recorded as applied).
3. Paste the file contents and run.
4. Record that the migration ran (e.g. in a project tracker) — there is
   no automatic ledger yet.

## Convention

- Filenames: `NNN_description.sql`, zero-padded to three digits.
- Each migration must be idempotent where reasonable (`create table if
not exists`, `create index if not exists`, etc.).
- Never edit a migration file once it has been applied to any
  environment — write a new one instead.

## Current migrations

| File                   | Purpose                                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `001_ai_usage.sql`     | `ai_usage` table for per-call token + cost tracking, with RLS allowing each user to read their own rows. Service role inserts.                                                                                                                                                                                                                |
| `002_perf_indexes.sql` | Performance indexes on hot read paths.                                                                                                                                                                                                                                                                                                        |
| `003_pgvector.sql`     | `pgvector` extension + `chat_embeddings` table (1536-dim OpenAI embeddings) + `match_chat_embeddings` RPC for top-k cosine recall. RLS read-own; service-role writes. **Apply in two passes:** run once to create the table; backfill rows with `pnpm backfill:embeddings`; re-run to actually build the ivfflat index against existing rows. |

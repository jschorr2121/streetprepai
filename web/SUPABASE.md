# Supabase Local Dev Workflow

Street Prep AI uses [Supabase](https://supabase.com/) for auth, database, and
storage. Migrations live in `supabase/migrations/`, seeded via `supabase/seed.sql`.

## Prerequisites

```bash
brew install supabase/tap/supabase   # or: npm i -g supabase
brew install docker                  # Supabase local stack runs in Docker
```

## First-time setup

```bash
cd web

# Start the local Supabase stack (Postgres, Auth, Studio, …)
supabase start

# Apply all migrations + seed data
supabase db reset

# Link to your remote project (one-time, after `supabase projects create`)
supabase link --project-ref <your-project-ref>
```

`supabase start` prints local API URL, anon key, and service-role key. Copy
those to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<service role key from supabase start output>
```

## Daily workflow

```bash
# Apply pending migrations to local Postgres
supabase db push

# Or nuke and rebuild from scratch (runs seed.sql too)
supabase db reset

# Generate TypeScript types from DB schema (optional)
supabase gen types typescript --local > lib/database.types.ts

# Open Supabase Studio UI
open http://localhost:54323
```

## Writing a new migration

```bash
# Creates supabase/migrations/<timestamp>_<name>.sql
supabase migration new add_flashcards_table
# … edit the file …
supabase db push   # apply to local
```

Never edit a migration that's already been pushed to production. Write a new one.

## Pushing to production

```bash
# Preview what would be applied
supabase db diff --use-migra

# Apply to linked remote project
supabase db push --linked
```

CI runs migrations against an ephemeral local Postgres before integration
tests (see `.github/workflows/ci.yml`). The `supabase/seed.sql` provides
deterministic reference data (firms, jobs) that integration tests rely on.

## Migration order

| File                              | Purpose                                                    |
|-----------------------------------|------------------------------------------------------------|
| `0000_baseline.sql`               | Full initial schema (all per-user tables + reference data) |
| `0001_ai_usage.sql`               | `ai_usage` table for token/cost tracking                   |
| `0002_perf_indexes.sql`           | Composite and partial indexes for hot read paths           |
| `0003_pgvector.sql`               | pgvector extension + `chat_embeddings` + `match_chat_embeddings` RPC |

See `supabase/POLICIES.md` for RLS policy documentation.

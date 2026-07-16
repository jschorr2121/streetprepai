# 01 — Q-bank schema + seed + browse/pick a question

Status: ready-for-agent
Blocked by: —
PRD: ../PRD.md

## User-visible behavior

A signed-in user opens `/tools/question-bank`, picks a topic and a difficulty (easy / medium / hard), and is served a question from the curated bank. Refreshing/re-picking serves another question from the same filter.

## Scope

1. **Migration `web/supabase/migrations/0006_qbank.sql`** (idempotent, following the 0004/0005 style):
   - `qbank_questions` (uuid PK default, `topic text`, `difficulty text CHECK (easy|medium|hard)`, `prompt text`, `rubric jsonb`, `source text CHECK (curated|ai_generated) DEFAULT 'curated'`, `created_at`). Shared content: RLS enabled, `SELECT` for authenticated users, no user writes (writes happen via service role / seed only).
   - `qbank_followups` (uuid PK, `question_id` FK → qbank_questions, `parent_followup_id` nullable self-FK, `prompt text`, `rubric jsonb`, `ordinal int`). Same read-only RLS.
   - `qbank_attempts` (uuid PK, `user_id uuid`, `question_id` FK, `followup_id` nullable FK, `answer text`, `score int`, `feedback jsonb`, `answered_at timestamptz DEFAULT now()`). Owner RLS (`USING/WITH CHECK user_id = auth.uid()`).
   - `qbank_spaced_state` (`user_id`, `question_id`, `next_due_at timestamptz`, `consecutive_correct int DEFAULT 0`, `updated_at`; PK (user_id, question_id)). Owner RLS.
   - `topic_mastery` (`user_id`, `topic text`, `score real`, `attempts int`, `updated_at`; PK (user_id, topic)). Owner RLS.
   - Attempts/spaced/mastery tables are created now so 02/04/05 don't need their own migrations; only the two content tables are used by this issue.
2. **Seed:** `web/scripts/seed-qbank.mjs` (`pnpm db:seed:qbank`) — inserts the `technical`-mode questions from `lib/data/interview-questions.ts` into `qbank_questions` (topic, difficulty mapped 1:1; `rubric` = `{ ideal_answer_outline: [...] }`). Idempotent (upsert on a stable slug or skip-if-exists). Do NOT delete `lib/data/interview-questions.ts` — mock-interview still uses it.
3. **Drizzle schema:** re-run `pnpm db:pull` (custom introspection script `scripts/introspect.mjs`) after applying the migration so `lib/db/schema/` gains the new tables. Note: the remote DB may be unreachable from dev (see progress-tracker); if so, hand-author the schema files matching the introspection style and flag it.
4. **Queries `web/lib/db/queries/qbank.ts`:** `listTopics(db)`, `getQuestionForUser(db, userId, { topic, difficulty })` (random among questions the user hasn't answered recently; simplest: `ORDER BY random()` excluding question ids attempted in the last 24h), `getQuestionById(db, id)`.
5. **UI `web/app/(app)/tools/question-bank/page.tsx`** (replace the stub): server component; topic + difficulty selection via URL searchParams (chips, same pattern as `tools/applications/_components/stage-filter.tsx`); renders the served question in a card with an answer textarea (disabled/no-op submit for now — submission is issue 02). Follow `ui-context.md` tokens; components under `app/(app)/tools/question-bank/_components/`.
6. **Tests:** PGlite-backed query tests (pattern: `tests/helpers/pglite-db.ts` + `tests/unit/lib/db/queries/applications.test.ts`) — filter correctness, two-user isolation on attempts exclusion.

## Not in scope

Grading, follow-ups, spaced logic, mastery (issues 02–05). AI generation (06).

## Verification

`pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`. Manual: pick topic/difficulty → question renders; migration applied + RLS spot-checked (log the apply step in `context/jakes-tasks.md` if the DB is unreachable from dev).

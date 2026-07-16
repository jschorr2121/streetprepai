# PRD — Unit 8: Technical Question Bank (tracer bullet)

Status: ready-for-agent
Date: 2026-07-07
Sources: `context/project-overview.md` (Goal 4, Feature "Technical Question Bank", Success Criteria 7 + 12), `context/architecture.md` (Storage Model "Technical Question Bank" + "Mastery & engagement" groups, Invariants 1–5), `context/progress-tracker.md` (Unit 8 backlog entry)

## Problem

The Technical Question Bank is the core practice surface of the product and today it is a "Coming soon" stub (`web/app/(app)/tools/question-bank/page.tsx`). The spec's full loop is: **pick topic + difficulty → get a question → answer → AI grades against a rubric → attempt stored → mastery updated → weak questions re-surface in 2–3 days → correct answers fire follow-up probes**. None of that exists. This unit is the tracer bullet that cuts every layer.

## What exists to build on

- **Grading pipeline pattern:** `web/app/api/interview/score/route.ts` grades mock-interview answers with Claude via a forced `save_scorecard` tool (satisfies the no-`JSON.parse` invariant). The prompt lives in `lib/ai/prompts.ts`. Reuse the pattern, not the route.
- **Curated content:** `web/lib/data/interview-questions.ts` — 25 typed questions (`id, mode, topic, difficulty, text, idealAnswerOutline`). The `technical` ones are the seed corpus.
- **Canonical Server Action skeleton:** `web/app/(app)/profile/actions.ts` (7-step). Copy it.
- **DB access pattern:** `lib/db/client.ts` `withUser()` + `lib/db/queries/<domain>.ts`. Migrations live in `web/supabase/migrations/` (next number: `0006`).
- **Cost/limits plumbing:** `lib/ai/usage.ts#logUsage` (writes `ai_usage`), `lib/ratelimit/limiters.ts#makeSlidingWindow`.

## Target user-visible behavior (phase scope)

1. User opens `/tools/question-bank`, picks a topic and difficulty (easy/medium/hard), and gets a question.
2. User types an answer; AI grades it against the question's rubric with a score + feedback.
3. Correct answers fire a follow-up probe from the question's follow-up tree (3–5 deeper probes per question).
4. Weak/incorrect questions automatically reappear in a "Due for review" queue after 2–3 days.
5. Attempts feed a per-topic mastery score; the user sees their top weak topics.
6. (Stretch) User can request an AI-generated fresh question for a topic/difficulty when the curated bank is exhausted.

## Data model (new tables, per `architecture.md`)

- `qbank_questions` — shared content, read-only to users: topic, difficulty, prompt, rubric (jsonb), source `curated | ai_generated`, embedding column deferred.
- `qbank_followups` — parent question → child probe tree.
- `qbank_attempts` — user_id, question_id, answer text, score, rubric breakdown (jsonb), answered_at. RLS owner-scoped.
- `qbank_spaced_state` — user_id, question_id, next_due_at, ease/history. RLS owner-scoped. Drives re-surfacing.
- `topic_mastery` — user_id, topic, score, updated_at. RLS owner-scoped.

## Decisions made in this PRD (flag if you disagree before implementing)

- **No Inngest in this unit.** Spaced re-surfacing is computed at write time (set `next_due_at` when grading) and read time (query due rows on page load). No background job is required for the MVP loop; the Inngest-driven daily sweep in `architecture.md` becomes relevant only when we add notifications/email nudges. Log this in `CHANGES.md` when the unit lands.
- **Curated seed via migration/seed script**, migrating the technical questions out of `lib/data/interview-questions.ts` into `qbank_questions`. Rubrics: derive from each question's `idealAnswerOutline`.
- **Grading is a Server Action**, not a Route Handler — grading is a single request/response mutation, not streaming. Rate-limited (LLM-calling: strict tier), `logUsage` on every call (invariants 4 + 5).
- **Mastery math lives in `lib/mastery/` as pure functions** (per architecture) — a simple weighted running score per topic is enough for phase 1; Bayesian refinement later.

## Out of scope for this unit

- Embeddings on questions (duplicate detection / similarity) — needs Voyage SDK, not installed.
- Dashboard "top 3 weak areas" widget — mastery data lands here; the dashboard widget is a later dashboard unit. Issue 05 surfaces weak topics on the question-bank page itself.
- Learning-flow practice questions (`/learn/[chapter]/practice`) — same tables, separate unit.

## Success criteria

Maps to `project-overview.md` Success Criterion 7 end-to-end: topic + difficulty → question (curated or AI-generated) → AI grade → follow-up on correct answer → weak question resurfaces 2–3 days later. All six "done" gates from `ai-workflow-rules.md` pass per issue.

## Issues (tracer-bullet DAG)

| # | Slice | Blocked by |
|---|-------|-----------|
| 01 | Schema + seed + browse/pick a question | — |
| 02 | Answer → AI grade → attempt stored | 01 |
| 03 | Follow-up question tree | 02 |
| 04 | Spaced re-surfacing ("Due for review") | 02 |
| 05 | Topic mastery + weak-topic display | 02 |
| 06 | AI-generated questions (stretch) | 02 |

# 02 — Answer a question → AI grades it → attempt stored

Status: ready-for-agent
Blocked by: 01
PRD: ../PRD.md

## User-visible behavior

User types an answer to the served question and submits. Within a few seconds they see a graded result: score (0–10), what they got right, what they missed (rubric breakdown), and a model-answer summary. The attempt is persisted and visible in a small "Recent attempts" list on the page.

## Scope

1. **AI grading in `web/lib/ai/`:** add a `gradeQbankAnswer({ question, rubric, answer })` helper (new module `lib/ai/qbank.ts` or extend `prompts.ts`) that calls Claude (`MODELS.sonnet` from `lib/ai/anthropic.ts`) with a **forced tool** `save_grade` — schema: `{ score: 0-10, correct: boolean, rubric_breakdown: [{ point, hit, comment }], feedback, model_answer }`. Never `JSON.parse` free text (architecture invariant 2). Prompt-cache the system block if >1K tokens (invariant 7). Must call `logUsage` (`lib/ai/usage.ts`) with endpoint `qbank/grade` (invariant 4).
2. **Server Action `web/app/(app)/tools/question-bank/actions.ts`:** `submitAnswerAction({ questionId, answer })` following the 7-step skeleton from `app/(app)/profile/actions.ts`:
   - `requireUser` → Zod (answer 1–5000 chars) → **rate limiter** `qbankGradeLimiter` (new in `lib/ratelimit/limiters.ts`, LLM-calling: 10 req/min per user, degrade-open) → load question via `withUser` → grade via `lib/ai` → insert `qbank_attempts` row via new query `createAttempt(db, userId, {...})` → return `ActionResult<GradeResult>`.
   - `correct` = score ≥ 7 (single constant, exported — issues 03/04/05 reuse it).
3. **Queries:** add `createAttempt`, `listRecentAttempts(db, userId, limit)` to `lib/db/queries/qbank.ts`.
4. **UI:** answer form (client component, RHF + Zod, `useTransition`, sonner toasts — mirror `profile-edit-form.tsx`); graded result card (score badge, rubric checklist, feedback, collapsible model answer); "Recent attempts" list (server-rendered).
5. **Tests:** Vitest — schema rejection, UNAUTHORIZED gate, RATE_LIMITED gate (mock limiter), grading helper prompt-builder unit test with mocked Anthropic client (assert forced tool + logUsage called); PGlite tests for `createAttempt`/`listRecentAttempts` isolation.
6. **e2e:** extend/author `tests/e2e/question-bank.spec.ts` golden path (answer → graded card appears), auth-gated behind `STREETPREP_E2E_AUTH=1`, LLM mocked or skipped in CI per existing convention.

## Security checklist (must-haves, not suggestions)

- Action is auth-gated (`requireUser`) and rate-limited **before** the Claude call — this endpoint spends money per call.
- `logUsage` on every grade, including failures where tokens were consumed.

## Verification

All six done-gates. Manual demo: answer a DCF question badly → low score with missed rubric points; answer well → high score.

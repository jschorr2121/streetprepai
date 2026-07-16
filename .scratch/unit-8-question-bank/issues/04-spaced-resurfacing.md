# 04 — Spaced re-surfacing of weak questions ("Due for review")

Status: ready-for-agent
Blocked by: 02
PRD: ../PRD.md

## User-visible behavior

Questions the user got wrong (or scored weakly on) automatically reappear: `/tools/question-bank` shows a "Due for review" section listing questions whose review date has arrived, with a one-click "Retry" that serves that question. Per spec, weak questions come back every 2–3 days until mastered.

## Scope

1. **Scheduling logic — pure functions in `web/lib/mastery/spaced.ts`:** `nextReview({ correct, consecutiveCorrect })` →
   - incorrect → due in 2 days, `consecutive_correct` reset to 0;
   - correct once after a miss → due in 3 days;
   - correct twice consecutively → mastered (clear `next_due_at`, row retained for history).
   Keep it this simple — no SM-2 ease factors in phase 1. Unit-test the function exhaustively.
2. **Wire into grading:** `submitAnswerAction` (issue 02) upserts `qbank_spaced_state` after storing the attempt (root questions only; follow-up attempts don't schedule).
3. **Queries:** `getDueQuestions(db, userId, now)` — join spaced_state → questions where `next_due_at <= now`; `upsertSpacedState(db, userId, questionId, {...})`.
4. **UI:** "Due for review" card list at the top of `/tools/question-bank` (count badge, topic + difficulty per item, Retry link that pins `?question=<id>`); empty state when nothing is due. The page's `getQuestionForUser` honors an explicit `question` searchParam.
5. **No Inngest** (PRD decision): due-ness is evaluated at read time. When notification nudges arrive later, an Inngest sweep can layer on without schema change.
6. **Tests:** Vitest on `nextReview` (all branches); PGlite on `getDueQuestions` (due vs future vs mastered vs other-user rows).
7. **Determinism note:** take `now` as a parameter everywhere (queries + pure fns) so tests don't depend on wall-clock.

## Verification

All six done-gates. Manual demo: answer a question wrong → row appears in `qbank_spaced_state` with `next_due_at` ≈ +2 days; temporarily backdate the row in SQL → question shows under "Due for review" → answer correctly twice → it stops resurfacing.

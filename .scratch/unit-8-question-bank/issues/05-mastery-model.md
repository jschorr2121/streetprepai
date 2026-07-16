# 05 — Topic mastery score + weak-topic display

Status: ready-for-agent
Blocked by: 02
PRD: ../PRD.md

## User-visible behavior

Every graded attempt updates a per-topic mastery score. The question-bank page shows a compact "Your topics" strip — each topic with a mastery bar — and highlights the user's weakest 3 topics with a one-click "Drill" CTA (serves a question from that topic).

## Scope

1. **Mastery math — pure functions in `web/lib/mastery/mastery.ts`:** exponentially-weighted running score per topic: `newScore = old + α * (attemptScore/10 - old)` with `α = 0.3`, seeded at the first attempt's normalized score. Track `attempts` count. Pure, unit-tested; per `architecture.md` this module never does LLM or network calls.
2. **Wire into grading:** `submitAnswerAction` (and follow-up action) upsert `topic_mastery` after each stored attempt, using the question's topic.
3. **Queries:** `getTopicMastery(db, userId)`, `upsertTopicMastery(db, userId, topic, {...})` in `lib/db/queries/qbank.ts` (or `lib/db/queries/mastery.ts` if it stays cleaner — one home, not both).
4. **UI:** "Your topics" strip on `/tools/question-bank` (server-rendered): topic name, mastery bar (0–100%), attempt count; weakest 3 topics get emphasis + "Drill" link (`?topic=<t>`). Topics with no attempts show as "not started" rather than 0%.
5. **Tests:** Vitest on the EWMA math (first attempt, improvement, regression, clamping); PGlite on upsert + isolation.

## Not in scope

Dashboard "top 3 weak areas" widget and `/progress` heatmap (separate dashboard/progress unit — this issue produces the data they will read). Mock-interview and learning-flow signals feeding mastery (spec wants them eventually; phase 1 mastery is q-bank-only — noted in PRD).

## Verification

All six done-gates. Manual demo: answer 3 accounting questions (2 wrong, 1 right) → accounting shows as a weak topic with a Drill CTA; drill serves an accounting question.

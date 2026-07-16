# 03 — Follow-up question tree fires on correct answers

Status: ready-for-agent
Blocked by: 02
PRD: ../PRD.md

## User-visible behavior

When the user answers a question correctly (score ≥ threshold from issue 02), the graded card offers a follow-up probe — a deeper question the way a real interviewer would push ("OK, and how does that change if the company has negative working capital?"). Answering the follow-up grades it the same way and can chain to the next probe (up to the depth seeded, 3–5 per root question).

## Scope

1. **Seed follow-ups:** extend `scripts/seed-qbank.mjs` to generate and insert 3–5 follow-up probes per curated technical question into `qbank_followups`. Authoring approach: hand-write follow-ups for the seed corpus in a checked-in data file (`web/lib/data/qbank-followups.ts` or JSON) — do NOT generate them at seed time with an LLM (seeds must be deterministic and reviewable in a PR).
2. **Queries:** `getNextFollowup(db, { questionId, parentFollowupId })` in `lib/db/queries/qbank.ts`.
3. **Server Action:** `submitFollowupAnswerAction({ questionId, followupId, answer })` — same 7-step shape as issue 02, grades against the follow-up's rubric, stores the attempt with `followup_id` set, returns grade + the next follow-up in the chain (if any and if correct).
4. **UI:** graded card gains a "Follow-up" section that reveals the probe with its own answer box; chain renders as a vertical thread so the user sees the interviewer-style escalation. Chain ends with a small summary (n/m probes cleared).
5. **Tests:** PGlite — tree traversal order, chain terminates; action tests — follow-up only offered when correct, NOT_FOUND on mismatched question/followup pair.

## Not in scope

Follow-ups affecting spaced re-surfacing or mastery beyond normal attempt rows (04/05 read attempts uniformly).

## Verification

All six done-gates. Manual demo: answer the EV vs equity value question correctly → follow-up appears → answer it → next probe or completion summary.

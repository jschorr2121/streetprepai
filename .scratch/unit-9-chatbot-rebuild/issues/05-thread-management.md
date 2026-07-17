# 05 — Thread management: list, switch, new, delete

Status: done (2026-07-17, relay session 4 — renameThread skipped per issue; e2e deferred)
Blocked by: 01
PRD: ../PRD.md

## User-visible behavior

The chatbot page has a slim thread rail: past conversations listed by title + relative date, a "New chat" button, switching threads loads that history, and a thread can be deleted (with confirm). Parallel to issues 02–04 — touches only persistence + UI, not the model loop.

## Scope

1. **Queries:** `listThreads(db, userId)` (already stubbed in issue 01 — finalize: ordered by `updated_at` desc), `deleteThread(db, userId, threadId)` (cascade messages — FK `ON DELETE CASCADE` in migration 0007; verify it's there, add a follow-up migration if not), `renameThread` optional — skip unless free.
2. **Server Actions `app/(app)/tools/chatbot/actions.ts`:** `deleteThreadAction({ threadId })` — 7-step skeleton, `applicationsLimiter`-style cheap limiter (no LLM call), NOT_FOUND on foreign/missing thread. New-chat needs no action (navigate to `/tools/chatbot?thread=new`; thread is created on first message per issue 01).
3. **Routing:** active thread from `?thread=<id>` searchParam (URL-state convention per `code-standards.md`); default = most recent thread, or empty state.
4. **UI:** thread rail inside the chatbot page (not the global sidebar), collapsible on small widths per `ui-context.md` layout patterns; delete via dropdown menu item + confirm dialog; active thread highlighted.
5. **Auto-title (cheap nicety, in scope):** keep first-message-prefix titles from issue 01. No LLM titling in phase 1.
6. **Tests:** PGlite — delete cascades messages, cross-user delete blocked; action tests — auth, NOT_FOUND, rate-limit gates; e2e addition: create two threads, switch, delete one.

## Verification

All six done-gates. Manual demo: two conversations, switch between them, delete one, reload — state consistent.

# 02 — Tool use: profile, applications, contacts, events, semantic chat search

Status: done (2026-07-17, relay session 4 — hybrid semantic+keyword search decision; see context/CHANGES.md)
Blocked by: 01
PRD: ../PRD.md

## User-visible behavior

The chatbot answers personal questions by consulting the user's own data and shows what it consulted. "What stage is my GS app at?" → fires `get_applied_jobs` → answers with the actual stage, with a source chip ("Checked: your applications"). "Who did I talk to about Apollo's culture?" → fires `search_chat_logs` → cites the matching contact/chat.

## Scope

1. **Tool consolidation in `web/lib/ai/assistant-tools.ts`:** keep the executors (`executeTool` internals) but expose the registry as AI SDK `tool()` definitions with Zod `inputSchema` — one shape, typed end-to-end. Tools: `get_resume` (profile), `list_contacts`, `get_contact`, `get_upcoming_events`, `search_chat_logs`, `get_applied_jobs`. Each execute receives `userId` via closure from the route (never from model input — the model must not choose whose data to read).
2. **Route:** pass `tools` + `stopWhen: stepCountAtMost(6)` (verify exact v6 API against docs) to `streamText`; multi-step tool loop handled by the SDK. Persist tool-call/tool-result parts in `chat_messages.content` (schema from issue 01 already supports it).
3. **Delete the parallel stack once parity is confirmed:** `web/lib/ai/assistant-tools-openai.ts`, `web/app/api/chat/general/route.ts`, and their tests. `lib/ai/openai.ts` STAYS (embeddings use it). Update `lib/ai/assistant-tools.test.ts` mocks accordingly.
4. **UI citations:** render tool invocations as inline chips/accordion in the message stream ("🔍 Searched your chat logs — 3 results"), from the message `parts`. Keep it lightweight — chip + expandable JSON-ish summary, per `ui-context.md` tokens.
5. **System prompt:** extend `CHAT_SYSTEM` with tool-routing guidance (when to use which tool; answer from general knowledge when tools aren't relevant; never fabricate personal data — say when a lookup came back empty).
6. **Tests:** Vitest — each tool's Zod schema + executor with stub executor/db (extend existing `assistant-tools.test.ts` patterns: grouping, stage filter, zero-results); a loop test with mocked model asserting `userId` is closure-injected; UI unit test for the citation chip rendering from parts.

## Prompt-injection note (review carefully, don't skip)

Tool results contain user-authored text (chat notes, application notes). Treat them as data: the system prompt must instruct the model that tool results are untrusted content, and tool executors must cap/sanitize output (`lib/ai/sanitize.ts#capText` exists — use it).

## Verification

All six done-gates. Manual demos: the two behaviors above, plus a general question ("walk me through a DCF") that fires no tools.

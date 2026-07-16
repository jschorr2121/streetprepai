# 01 — Streaming chat at /tools/chatbot with thread persistence

Status: ready-for-agent
Blocked by: —
PRD: ../PRD.md

## User-visible behavior

User opens `/tools/chatbot`, types a question, and watches a Claude answer stream in with markdown rendering. Reloading the page restores the conversation. No tools yet — plain assistant with the IB-mentor system prompt.

## Scope

1. **Migration `web/supabase/migrations/0007_chat_threads.sql`** (idempotent): `chat_threads` (uuid PK, `user_id`, `title text`, `created_at`, `updated_at`) + `chat_messages` (uuid PK, `thread_id` FK, `user_id`, `role text CHECK (user|assistant)`, `content jsonb`, `created_at`). Owner RLS on both (`USING/WITH CHECK user_id = auth.uid()`). `content` holds the AI SDK UIMessage `parts` array so tool calls (issue 02) persist without a schema change. Introspect/hand-author Drizzle schema files per the Unit 3 convention.
2. **Queries `web/lib/db/queries/chat.ts`:** `createThread`, `getThread`, `listThreads`, `appendMessages(db, userId, threadId, messages[])`, `getMessages(db, userId, threadId)`.
3. **Route Handler `web/app/api/chat/assistant/route.ts`:**
   - **Before consulting docs is mandatory here:** fetch current AI SDK v6 docs (`find-docs` / Context7: `ai`, `@ai-sdk/anthropic`) — the v5→v6 API changed (UIMessage/ModelMessage split, `toUIMessageStreamResponse`, `onFinish` persistence callback). Do not code from training data.
   - Auth via `lib/security/require-user.ts` `requireUser(req, { tier: "expensive", route: "chat/assistant" })` (rate limit BEFORE any model call — this route spends money).
   - `streamText` with `anthropic(MODELS.sonnet)`, system prompt from `lib/ai/prompts.ts#CHAT_SYSTEM` (+ prompt caching on the system block, invariant 7).
   - Persistence: load prior messages for the thread, append the incoming user message + streamed assistant message in `onFinish` via `withUser → appendMessages`. Accept `threadId` in the body; create the thread on first message (title = first ~60 chars of the message).
   - `logUsage` (endpoint `chat/assistant`) from the final usage in `onFinish` (invariant 4) — `trackStream` in `lib/ai/usage.ts` may need an AI-SDK-shaped sibling.
4. **UI:** `app/(app)/tools/chatbot/page.tsx` (server component: resolves/creates default thread, loads messages) + `_components/chat.tsx` (client, `useChat` from `@ai-sdk/react`, initial messages hydrated, streaming indicator, markdown via the same renderer the guide chat uses, auto-scroll, empty state with 3 suggested prompts e.g. "How should I study for LBOs?").
5. **Tests:** PGlite for `lib/db/queries/chat.ts` (round-trip, isolation, thread-scoped reads); route-level unit test with mocked `streamText` asserting auth gate + limiter + persistence callback; Zod body validation test.

## Not in scope

Tools/citations (02), web search (03), thread sidebar (05 — this issue may hard-code "latest thread or new").

## Security checklist

- Route is auth-gated + `expensive`-tier rate-limited before any Anthropic call.
- Thread/message reads and writes go through `withUser` (RLS), never the admin client.
- `logUsage` on every request.

## Verification

All six done-gates. Manual: send message → streamed reply → reload → history intact; second user cannot read the thread (RLS spot-check).

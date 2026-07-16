# PRD — Unit 9: Chatbot rebuild with tool use

Status: ready-for-agent
Date: 2026-07-07
Sources: `context/project-overview.md` (Goal 7, Feature "AI Chatbot", Success Criterion 3), `context/architecture.md` (Stack "AI SDK layer" + "Web search", Storage "Chatbot history", Routes `api/chat/stream`, Invariants 1–7), `context/progress-tracker.md` (Unit 9 backlog, "AI Chat sidebar entry" open question), `todo.md` ("add ai chat back", "add ai chatbot")

## Problem

The spec's flagship AI surface — a tool-using chatbot at `/tools/chatbot` that can answer "prep me for why JPM" by pulling from the user's profile, networking history, firm data, and the web — does not exist as a usable product surface:

- `/tools/chatbot` page is a **stub**.
- The only tool-using agent (`app/api/chat/general/route.ts`) runs on **OpenAI `gpt-5.4-nano`** with a hand-rolled NDJSON loop, is **wired to no UI**, and violates the locked stack (architecture: Vercel AI SDK `useChat` + Anthropic Claude for the chatbot).
- There is **no conversation persistence** — the spec requires `chat_threads` / `chat_messages`. (The existing `chats` table is networking chat *logs*, a different domain.)
- Tool definitions are **duplicated** in two shapes (`lib/ai/assistant-tools.ts` Anthropic-style + `assistant-tools-openai.ts`), and `web_search` is a stub.

## What exists to build on

- Tool registry + executors: `lib/ai/assistant-tools.ts` — `get_resume`, `list_contacts`, `get_contact`, `get_upcoming_events`, `search_chat_logs` (semantic, working), `get_applied_jobs` (Drizzle-backed). The **executors** are sound; the transport gets rebuilt.
- `ai` v6 + `@ai-sdk/anthropic` are already installed (Unit 2) and unused — exactly what this unit needs.
- `lib/ai/anthropic.ts` MODELS, `lib/ai/usage.ts#logUsage` + `trackStream`, `lib/security/require-user.ts` (Route Handler auth + `expensive` limiter tier), `lib/ai/prompts.ts#CHAT_SYSTEM`.
- Guide-scoped chat (`/api/chat/stream` + `components/reader/chat-panel.tsx`) works and is **not touched** by this unit — it is the Reading Lens surface and migrates to `api/lens/*` in a later unit.

## Target user-visible behavior

1. `/tools/chatbot` is a real chat: streaming Claude responses, markdown rendering, conversation history that survives reload.
2. The bot uses tools: it can answer from the user's profile, applications, contacts, upcoming events, and semantically search their networking history — and shows which sources it consulted (citations/tool chips).
3. The bot can search the web (Anthropic native `web_search` tool).
4. The bot can pull firm data and synthesize "prep me for why JPM" across profile + past JPM chats + firm page + general knowledge — Success Criterion 3.
5. Users can start new threads and revisit/delete old ones.

## Architecture decisions (this PRD)

- **Transport:** new Route Handler `app/api/chat/assistant/route.ts` (streaming is the legitimate Route-Handler exception, invariant 6) built on AI SDK `streamText` + `@ai-sdk/anthropic`, client on `useChat`. The spec names this route `api/chat/stream`, which is currently occupied by the guide chat — we take `api/chat/assistant` now and reconcile naming when the guide chat moves to `api/lens/*`. Log in `CHANGES.md`.
- **Model:** Claude Sonnet (`MODELS.sonnet`) default; no per-message model picker in phase 1.
- **Persistence:** new tables `chat_threads` (id, user_id, title, created_at, updated_at) + `chat_messages` (id, thread_id, user_id, role, content jsonb — AI SDK message parts incl. tool calls/results —, created_at). Owner RLS on both. Migration `0007`.
- **Tool consolidation:** one registry. Executors stay in `lib/ai/assistant-tools.ts`, re-exposed as AI SDK `tool()` definitions with Zod input schemas. `assistant-tools-openai.ts` and `app/api/chat/general/route.ts` are **deleted** once parity is reached (issue 02). `lib/ai/openai.ts` stays only if anything else uses it (embeddings do — `text-embedding-3-small`; leave embeddings alone this unit).
- **Cost + safety rails (non-negotiable, per invariants 4–5):** `requireUser` + `expensive`-tier rate limit on the route; `logUsage` per request including tool-loop steps; cap the agent loop (`stopWhen`/max steps ≈ 6); prompt-cache the system + profile block.

## Out of scope

- Reading Lens / guide chat migration to `api/lens/*`.
- Voyage embeddings migration (semantic search keeps `text-embedding-3-small` for now — open question in progress-tracker).
- Voice input, file attachments, IB knowledge-base RAG over chapter content (needs embeddings work).
- Dashboard/chat cross-surfacing.

## Success criteria

Success Criterion 3 end-to-end: "prep me for why JPM" answers with visible sources from (a) profile, (b) past JPM chats, (c) firm data, (d) general knowledge. Plus: threads persist, tools visibly fire, all six done-gates per issue.

## Issues (tracer-bullet DAG)

| # | Slice | Blocked by |
|---|-------|-----------|
| 01 | Streaming chat + thread persistence (no tools) | — |
| 02 | Tool use + source citations (consolidate registries) | 01 |
| 03 | Native web search | 02 |
| 04 | Firm-data tool + "why JPM" golden path | 02 |
| 05 | Thread management (list / switch / delete) | 01 |

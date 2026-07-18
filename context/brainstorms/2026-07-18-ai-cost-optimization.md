# Brainstorm: AI cost optimization

Scope: every server-side AI call path — `web/lib/ai/{pricing,usage,anthropic,grading,chat-title,embeddings,openai}.ts`,
`web/app/api/chat/assistant/route.ts`, `web/app/api/interview/score/route.ts`,
`web/app/api/resume/critique/route.ts`, `web/app/api/{interview,whisper}/transcribe/route.ts`.
Verified live against Anthropic's docs and OpenAI pricing pages this session (2026-07-18) — cited inline. Anything not
cited is inferred from reading the code, not independently verified.

## Current spend surface

- **Chat assistant** (`app/api/chat/assistant/route.ts`) — Sonnet 4.6 (`MODELS.sonnet`) via AI SDK v7 `streamText`,
  7 closure tools (`assistant-tools.ts`) + Anthropic's legacy `webSearch_20250305`, 30-message sliding context window
  (`MODEL_CONTEXT_MESSAGES`). `system: ASSISTANT_SYSTEM` is a **plain string** — no `cache_control` anywhere on this
  route. Highest per-user call volume of any route (every chat turn) and the only multi-turn surface, so it's the
  biggest lever.
- **Grading** (`lib/ai/grading.ts`) — Sonnet 4.6, one call per graded answer (qbank's core loop, likely the
  highest-volume single call type). System (~230 tokens) + one tool (`save_grade`, ~150–200 tokens) already carries
  `cache_control: { type: "ephemeral" }`, but the combined prefix is well under the cache-eligible floor (see below).
- **Interview score** (`app/api/interview/score/route.ts`) — Opus (`MODELS.opus` = `claude-opus-4-7`). Large system
  prompt (`INTERVIEW_SCORE_SYSTEM`, ~5,000 chars) + `save_scorecard` tool, already `cache_control`'d and almost
  certainly above the caching floor.
- **Resume critique** (`app/api/resume/critique/route.ts`) — same Opus model, `RESUME_CRITIQUE_SYSTEM` (~3,800 chars)
  + `critique_resume` tool, already `cache_control`'d; borderline size, worth a token count.
- **Thread titling** (`lib/ai/chat-title.ts`) — Haiku, ~20 output tokens, tiny input. Already the cheap model; fine
  as-is.
- **Whisper transcription** (`app/api/{interview,whisper}/transcribe/route.ts`) — OpenAI `whisper-1`, billed as a flat
  `surchargeUsd` (`WHISPER_USD_PER_MINUTE = 0.006`), not token-priced.
- **Embeddings** (`lib/ai/embeddings.ts`) — OpenAI `text-embedding-3-small`, called synchronously on every chat-log
  write and every `search_chat_logs` tool invocation (`assistant-tools.ts`), plus a one-off bulk pass in
  `scripts/backfill-embeddings.ts`.

## Ranked opportunities

1. **Fix the Opus pricing bug in `lib/ai/pricing.ts`.** [S, first: change `PRICING["claude-opus-4-7"]` from
   `{input: 15, output: 75}` to `{input: 5, output: 25}`] — Anthropic's current pricing page lists Opus 4.7 at
   $5/$25 per MTok, not $15/$75 (that's roughly the old Opus 3-era rate); Opus 4.8/4.7 are priced identically.
   [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) This isn't a spend
   *reduction* — it's a 3x overstatement in every `interview/score` and `resume/critique` `ai_usage` row, which feeds
   `assertUnderQuota`'s $20/user/month cap directly (`lib/ai/usage.ts`). Every other estimate below assumes accurate
   pricing, so this should land first regardless of priority.
2. **Wire real prompt caching into `chat/assistant`.** [M, first: convert `system: ASSISTANT_SYSTEM` (a string) to
   the AI SDK's block form with `providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } }` — a bare
   string system prompt does not cache at all under `@ai-sdk/anthropic`]
   [AI SDK Anthropic provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) ·
   [vercel/ai #7612](https://github.com/vercel/ai/issues/7612). Anthropic's current minimum cacheable prefix for
   Sonnet 4.6 is 1,024 tokens (verified live — lower than the 2,048 figure this skill's cached docs assumed);
   [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) `ASSISTANT_SYSTEM` +
   the 7 tool schemas in `assistant-tools.ts` are plausibly 1,400–2,100 tokens combined (tools count toward the
   prefix even though the marker sits on the system block) — likely clears the floor, but count it with
   `messages.count_tokens` before relying on the estimate. Cache reads are ~0.1x input price, so on any thread past
   turn 1 this is close to free re-processing of the system+tools block; multi-turn threads are exactly where this
   route spends the most.
3. **Upgrade the web-search tool to `web_search_20260209`.** [S–M, first: swap
   `anthropic.tools.webSearch_20250305({...})` → `webSearch_20260209({...})` in `chat/assistant/route.ts`; confirm
   the installed `@ai-sdk/anthropic@^4.0.16` exports it] Dynamic filtering runs code to trim search results before
   they hit context, instead of dumping full encrypted content into input tokens.
   [Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) This matters
   specifically because Anthropic's web_search results get re-billed as input tokens on *every subsequent turn* of
   a conversation, not just the turn that searched — so in a chat this long-lived (30-message window), search
   bloat compounds. [Web search billing note](https://www.firecrawl.dev/blog/anthropic-web-search-alternatives)
   Per-search price ($10/1,000 = `WEB_SEARCH_PER_CALL_USD`) is unchanged and already correct.
4. **Swap Whisper for `gpt-4o-mini-transcribe`.** [S, first: change the model string in both transcribe routes and
   rename/re-value `WHISPER_USD_PER_MINUTE`] Currently $0.006/min; `gpt-4o-mini-transcribe` is $0.003/min — a flat
   50% cut on every mock-interview and general transcription call.
   [gpt-4o-mini-transcribe pricing](https://openrouter.ai/openai/gpt-4o-mini-transcribe) Gated on a transcript-quality
   check (below).
5. **Cascade grading: Haiku-first, escalate to Sonnet on nuance.** [M, first: branch in `gradeAnswer` on
   `input.questionType` — route `calculation`-type or other objective types to `MODELS.haiku` first, keep `MODELS.sonnet`
   for behavioral/conceptual types or when the cheap pass looks unconfident] This is the standard 2026 LLM-cascade
   pattern — cheap model handles the easy majority, escalate only on a difficulty/confidence signal.
   [LLM cascade routing](https://www.digitalapplied.com/blog/llm-model-routing-2026-cost-quality-optimization-engineering-guide)
   Grading is likely the single highest-volume AI call in the product, so even a partial Haiku share (haiku is
   1/3 the token price of sonnet) is meaningful. Needs an eval pass — misconception/depth-calibration judgment is
   subjective and may not survive the downgrade for all question types (see Open Questions).
6. **Batch API for future bulk/offline work only.** [S when the workload exists] 50% off token price, but every
   current AI-calling route is synchronous and user-facing — nothing to move today. Flag it for the deferred
   AI-generated qbank question pipeline (`jakes-tasks.md` issue 06) if/when that ships, and for
   `scripts/backfill-embeddings.ts`-style bulk jobs (OpenAI's embeddings Batch tier is also 50% off,
   [OpenAI embedding pricing](https://tokenmix.ai/blog/openai-embedding-pricing)).

## Checked and rejected

- **Caching `grading.ts`'s system+tool prefix as-is.** Combined ~400–550 tokens, well under Sonnet 4.6's
  verified 1,024-token cache floor — the existing `cache_control` marker is a harmless no-op today, not a bug.
  Artificially padding the prompt just to clear the threshold isn't worth it: the absolute per-call savings on a
  ~500-token prefix are a fraction of a cent, and the risk of the pad drifting into "real" instructions Claude
  reads too literally isn't worth trading for that. Prefer routing (#5) over caching here.
- **Downgrading `chat/assistant` off Sonnet entirely.** The system prompt explicitly asks for firm-prep synthesis
  with source attribution across `get_resume`/`get_firm`/`search_chat_logs` results — multi-tool synthesis with
  faithfulness constraints is exactly where a cheap model's error rate rises. Not ruled out forever, but needs an
  eval, not a blind swap.
- **A cheaper OpenAI embedding model.** `text-embedding-3-small` is already OpenAI's cheapest current-generation
  embedding model at $0.02/M tokens; the only cheaper legacy option (`ada-002`) is lower-quality and being phased
  out, not a real alternative. [Embedding pricing 2026](https://embeddingcost.com/openai) No action.
- **Batch API for `interview/score` / `resume/critique` / `chat/assistant`.** All three are synchronous,
  user-waiting requests — Batch's minutes-to-hours turnaround doesn't fit any of them.

## Open questions for Jake

1. **Whisper swap risk**: `interview/score`'s delivery scoring leans on the Whisper transcript for filler-word
   count, WPM, and pause detection. Is a transcript-quality regression (if any) from `gpt-4o-mini-transcribe`
   acceptable for that 50% cost cut, or should we A/B a batch of real recordings first?
2. **Grading cascade risk tolerance**: comfortable spending an eval pass to see whether Haiku can grade
   `calculation`/objective question types at parity with Sonnet, given depth-calibration and misconception
   detection are inherently judgment calls? What score-delta would be acceptable before reverting a question type
   back to Sonnet?
3. **Quota-cap re-check**: now that Opus calls have been mis-priced 3x high since `pricing.ts` was written, is it
   worth spot-checking whether any real users hit the $20/month cap prematurely because of it?
4. **Caching TTL tradeoff**: the chat assistant's system+tools prefix is stable across a session but users are
   sporadic — worth the 2x write cost of a 1-hour cache TTL instead of the default 5-minute TTL to survive gaps
   between messages, or is 5-minute fine given typical turn cadence?

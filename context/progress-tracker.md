# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

**Specs complete. Implementation phase 1 — in-place migration of `/web` toward spec — in progress.**

The six context files (`project-overview.md`, `architecture.md`, `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`, this file) are all drafted and locked. The current `/web` prototype is ~50–60% aligned with spec already — strategy is to migrate incrementally via tracer-bullet vertical slices, not rebuild from scratch.

Foundation units landed so far: **Unit 1 (cleanup), Unit 2 (dependency parity), Unit 3 (Drizzle wrap), Unit 4 (auth UI + middleware), Unit 5 (IA refactor), Unit 6 (Server Action pattern proof)**. All foundation units are complete.

## Current Goal

Feature work. Next up: **Unit 7 (Application Tracker)** — first net-new feature on the new architecture.

## Completed

### Observability & error triage — Sentry pino integration, logger-routed error paths, AI-call context (2026-07-21) — COMPLETE

Implemented the four AFK-safe items from
`context/brainstorms/2026-07-21-observability-error-triage.md` (ideas #1–#4).
Suite **975 passing / 125 files**; typecheck/lint/build/format all green.

1. **`Sentry.pinoIntegration()` + `enableLogs: true`** in
   `web/sentry.server.config.ts`. Verified the exact option shape against the
   installed `@sentry/nextjs@10.51.0`'s `.d.ts` (not training data/docs
   snippets) — the real shape is `{ error: { levels: ["error"] } }`, **not**
   the `{ captureErrors: [...] }` shape some docs describe. Every
   `logger.error(...)` call is now a real Sentry event with zero per-call-site
   wiring.
2. **Routed the shared `clientSafeError` (`web/lib/security/client-error.ts`,
   22 call sites) and all of `web/lib/ai/usage.ts`'s `console.warn`/`error`**
   (admin-client-missing, missing-userId, insert-failed, and the
   `getUserUsageThisMonth` query-failure path) through the pino `logger`,
   using the `err` key pino/Sentry expect for stack traces.
3. **`chat/assistant`'s `consumeStream({ onError })`** now logs through
   `logger.error` (with `routeKey`/`userId`) instead of `console.error`. The
   route's other two pre-existing `console.error` call sites (persist-failure,
   title-gen-failure) were left as-is — out of this task's named scope.
4. **AI-call context on Sentry events**: `lib/ai/usage.ts` calls
   `Sentry.setContext("ai_call", { model, endpoint, userId, costUsd })`
   alongside each failure's `logger` call. Verified from the installed pino
   integration's source that its error→`captureException` path only reads the
   `err` key off the log payload (it does **not** forward other structured
   fields onto the captured exception) — so `setContext` is the only way
   those fields reach the Sentry Issue; the same fields are also included
   directly in the paired `logger.error` payload so they reach Sentry's Logs
   product (via `enableLogs`) regardless of scope-propagation behavior.

Not done here (explicitly out of scope): idea #7 (`ai_usage.latencyMs`
schema/capture — own unit) and any Sentry *client* config changes. Jake item
logged: set a Sentry alert-rule threshold before the newly-surfaced errors
cause notification fatigue (`context/jakes-tasks.md`, 🟠 section).

### Prod-readiness relay — bug-hunt fixes, mock-interview persistence, a11y, e2e (2026-07-21, session 9) — COMPLETE

9 commits pushed; suite **973 passing / 125 files** (from 932/122); typecheck/
lint/build green; opus adversarial review of the full session diff confirmed
all majors clean, 3 low findings fixed same-session. Highlights: **mock
interviews now persist** (the save API existed but was never called — every
completed interview vanished; plus a new Past Sessions list), **qbank
follow-up scores no longer clobber gate averages** (could flip pass→fail) and
topic mastery is race-safe (FOR UPDATE), **blank deadline no longer silently
breaks application saves**, oversized request bodies are rejected before
buffering (3 routes), systemic a11y fixes (live regions on every AI wait,
product-tour focus management), 5 gated e2e specs for the session-8 surfaces.
Details in `context/CHANGES.md` session-9 entry.

### Prod-readiness relay — launch-compliance builds: account deletion, legal pages, feedback, health (2026-07-20, session 8) — COMPLETE

Final: 15 commits, suite **932/122**, all gates green. Wave 3: opus adversarial
review → privacy-page honesty fixes + dedicated export limiter (6/hour); UX
sweep → settings back-link + feedback button moved bottom-left (sonner toast
collision). Wave-2 and wave-1 details below.

Wave 2 (same day): **data export** shipped (`GET /api/account/export`, 18 tables,
download button on settings — issue 01 closed), **assistant injection framing**
(tool/web_search results framed as untrusted data — issue 02 closed), dead
`resumes`/`interview_sessions` Drizzle schema files deleted (no migration ever
created them), and **+37 page/reader tests** (suite **931/122**). An opus
adversarial review of the full session diff runs at session end.

Wave 1: suite **888 passing / 113 files** (from 855/105); typecheck/lint/build/repo-wide
prettier all green. Shipped the top-4 AFK-safe items from the launch-readiness
brainstorm as three parallel-agent slices: (1) **self-serve account deletion** at
`/profile/settings` (confirm-twice type-DELETE dialog → storage-prefix cleanup →
`auth.admin.deleteUser`; cascade audit over migrations 0000–0012 confirmed every
user-owned table cascades from `auth.users`; clears `sp-onboarded`; PostHog
person-delete deferred — analytics still unwired); (2) **privacy policy + ToS +
custom 404** (`/privacy`, `/terms`, `app/not-found.tsx`, linked from footer/
signup/sitemap; subprocessors verified from code — found and fixed the Groq→OpenAI
transcription doc drift in architecture.md); (3) **feedback widget** (floating
dialog on all authed pages → `feedback` table, migration 0012, owner RLS) +
**`GET /api/health`** liveness probe (no-auth allowlisted in middleware, DB
`select 1`, 200/503). Issues filed: `.scratch/launch-readiness/issues/01`
data export, `02` prompt-injection review. New Jake items: apply 0012, legal
review of privacy/terms, provision Storage buckets, `SUPABASE_SERVICE_ROLE_KEY`
in Vercel, external uptime monitor.

### Prod-readiness relay — component coverage, UX sweep, SEO baseline, ai_usage NOT NULL (2026-07-19, session 7) — COMPLETE

11 commits pushed; suite **803 passing / 97 files** (from 707/78); typecheck/lint/
build/repo-wide prettier all green. Details in `context/CHANGES.md` session-7 entry.
Highlights: session-6's mystery flake identified (PGlite cold-WASM instantiation vs
5s vitest default) and fixed with 15s test+hook timeouts; component dom coverage
went 2 → 19 test files (+81 tests) over learn/relationships/nav/markdown/profile/
firms/marketing; a fresh-eyes UX sweep produced 10 findings — 9 fixed (mode links,
daily-drill dead end, topic deep-links, inline field errors, aria-describedby,
label drift, regenerate/start-over data loss), 1 filed
(`.scratch/ux-polish/issues/01` reading-lens keyboard a11y); SEO baseline
(robots/sitemap/OG via `lib/site.ts`); deferred security Low #16 closed
(migration 0011 makes `ai_usage.user_id` NOT NULL, `logUsage` hardened). New Jake
items: apply 0011; set `NEXT_PUBLIC_SITE_URL` in Vercel.

### Prod-readiness relay — rate-limit stack consolidation + coverage push + AI cost fixes (2026-07-18, session 6) — COMPLETE

Final numbers: ~18 commits pushed; suite **720 passing / 80 files** (from 521/65);
typecheck/lint/build/e2e-baseline all green. Late additions beyond the checkpoint
notes below: Anthropic prompt caching enabled on the chat assistant's stable prefix
(system + tool schemas now cache at 0.1x on hits); relationships + auth Server
Actions fully unit-tested (+68); stream-response bridge, dashboard tour action, and
analytics no-op paths covered (+25). Two new Jake questions filed (cheaper
transcription model; spend-cap context update).

Additions since the first checkpoint:

- **Consolidation complete** (slices 2–3): `checkRateLimit` now runs on the shared `lib/ratelimit/core.ts` primitive with key prefixes/tier numbers byte-preserved (no live bucket resets) and a new store-error policy — Redis failure denies AI tiers (expensive/whisper) and allows cheap/public, where previously any Redis throw 500'd the route.
- **Monthly spend cap now enforced in Server Actions**: new `assertAiActionAllowed(userId)` gates `gradeAnswerAction` (enumerated: the only AI-calling Server Action). Same error/message as the API routes; store-failure semantics identical to `require-user.ts`.
- **Opus pricing bug**: `PRICING["claude-opus-4-7"]` carried Opus-4.1-era \$15/\$75 rates; corrected to the published \$5/\$25 (cache 6.25/0.5). Interview scoring and resume critique were logged at 3x real cost, so users hit the \$20 monthly cap ~3x early. Historical `ai_usage` rows keep their stored cost.
- **AI cost brainstorm** committed (`context/brainstorms/2026-07-18-ai-cost-optimization.md`): chat assistant prompt caching (done, below), cheaper transcription model, web_search tool-version upgrade, model routing.
- **Chat assistant prompt caching landed**: `chat/assistant` now passes `ASSISTANT_SYSTEM` as a `SystemModelMessage` with `providerOptions.anthropic.cacheControl: { type: "ephemeral" }` (AI SDK v7 + `@ai-sdk/anthropic@4.0.16`). Anthropic serializes tools → system → messages, so the single system breakpoint caches the whole ~1.2–1.5k-token stable prefix (tool schemas + system) at the $0.30/MTok cache-read rate instead of re-billing $3/MTok every turn. `sdkUsageToTokenUsage` already mapped `cacheReadTokens`/`cacheWriteTokens`, so cache tokens flow into `ai_usage` with no mapping change. `generateThreadTitle` (haiku, ~164-token prefix) left as-is — too small to cache.
- Suite: **627 passing / 74 files**.

### (superseded by the above) Prod-readiness relay — rate-limit stack consolidation + coverage push (2026-07-18, session 6) — IN PROGRESS

- **fix(actions)** `actionErrorFromAppError` dropped `ValidationError.fieldErrors` — every Server Action translating a thrown ValidationError lost per-field form messages. Now propagated (`8bec85b`); regression test included in the batch below.
- **Coverage push (~120 new tests)**: pure-module unit tests for `lib/audio/analyze`, `lib/curriculum/{cycle,progress,chapters}`, `lib/validation/parse`, `lib/auth/{action-result,server}`, `lib/logging/request-context`, plus real-module tests for `lib/ai/grading` (previously only ever `vi.mock`'d away — prompt building, score rounding, no-tool_use error path now covered) and an `INTERNAL`-on-grading-throw case in the qbank action spec. (`c1869ad`, `43ccc64`, `c28ee8d`.)
- **Rate-limit consolidation (in flight)**: approved design extracts one shared sliding-window primitive (`lib/ratelimit/core.ts`) with the two existing surfaces (`lib/security/rate-limit.ts` Route Handler adapter, `lib/ratelimit/limiters.ts` Server Action adapter) kept as thin adapters; also closes a real gap — legacy `checkRateLimit` had NO store-error policy, so a Redis outage 500'd every route (now: deny for AI tiers, allow for cheap/public). Slice 1 landed (`1b011de`); slices 2–3 in progress.
- Known follow-up filed as relay task: AI-calling Server Actions (e.g. `gradeAnswerAction`) never run `assertUnderQuota` — the monthly spend cap only guards Route Handlers (design review finding R4).

### Prod-readiness relay — gate-scoring integrity fix + paper-LBO NaN drill fix (2026-07-18, session 9)

Fixed two verified findings, scoped to `web/` only, no schema migration:

- **Gate/drill scoring could be gamed client-side.** `finishSittingAction` (`app/(app)/learn/actions.ts`) recomputed a chapter-gate/section-drill score from `listSittingScores`, filtered only by client-supplied `context`/`chapterSlug`/`sectionSlug`/`startedAt`, with no check that the sitting actually contained the expected number of questions. Exploit: grade one easy question with `context: "chapter-gate"`, then call `finishSittingAction` — its lone score would be averaged in as if it were the full 8-question gate; an old `startedAt` could also sweep in unrelated historical attempts. Fixes, in order:
  1. **De-duplicated canonical sitting sizes.** `GATE_QUESTION_COUNT` (8) and `SECTION_DRILL_COUNT` (4) moved from page-level consts (`learn/[chapter]/practice/page.tsx`, `learn/[chapter]/drill/[section]/page.tsx`) into `lib/curriculum/chapters.ts` next to `GATE_PASS_THRESHOLD`; both pages now import them, and `finishSittingAction` imports the same constants — the client-facing count and the server-side check can no longer drift apart.
  2. **Server-side count enforcement.** Added `countGateQuestions` / `countSectionDrillQuestions` to `lib/db/queries/qbank.ts`. `finishSittingAction` now computes `expectedCount = min(GATE_QUESTION_COUNT | SECTION_DRILL_COUNT, <available pool size>)` — clamped to the pool so a thin chapter/section (some have as few as 1–6 seeded questions) can't lock legitimate sittings out — and rejects (`VALIDATION_FAILED`, via a `ValidationError` caught in the action's top-level `catch`) when `scores.length < expectedCount`. `listSittingScores` already dedupes to the latest attempt per `questionId`, so `scores.length` is simultaneously the attempt count and the distinct-question count — grading the same question repeatedly can't pad toward the target either. Documented in `listSittingScores`'s docstring.
  3. **Bounded the `startedAt` window.** Added `MAX_SITTING_DURATION_MS = 6h` in `actions.ts`; a `startedAt` older than that (or unparseable) is rejected before any DB access, closing the historical-attempt-sweep vector. 6h is deliberately generous (survives a long lunch break) — commented why.
  - **Residual, called out in-code:** the fix verifies _how many_ distinct questions were graded, not that they're the _specific_ questions the gate/drill page actually served (no per-sitting served-question set is persisted). Closing that fully needs server-side sitting sessions — out of scope for this fix per the finding's own guidance.
  - Client side needed no changes: `components/learn/practice-session.tsx` already displays `res.error.message` on a failed `finishSittingAction` call and offers a "Try again" retry (which mints a fresh `startedAt`), so the new rejection path degrades gracefully.
- **Paper LBO drill could reveal `NaNx`.** `generatePaperLbo` (`lib/curriculum/drills/generators.ts`) drew `entryMultiple = randInt(6,11)` and `leverage = randInt(3,6)` independently; when both landed on 6, `equityIn = entryTev - debt = 0`, making MOIC/IRR `NaN` (or `Infinity` with EBITDA growth) — an unsolvable drill. Fixed by constraining `leverage = randInt(rng, 3, Math.min(6, entryMultiple - 1))`, so leverage always stays strictly below the entry multiple (only tightens the range when `entryMultiple === 6`, from `[3,6]` to `[3,5]`).

Tests: new `tests/unit/app/learn-actions.test.ts` (PGlite-backed, following `tests/unit/app/qbank-actions.test.ts`'s mock pattern for auth/rate-limit/`withUser` but running real `lib/db/queries/qbank` + `lib/db/queries/curriculum` code against an in-memory Postgres) — too-few-attempts rejected, same-question padding rejected, stale-`startedAt` rejected, a thin-chapter sitting still passes once every available question is graded, and a legitimate full 8-question sitting passes and persists `chapter_progress`. Extended `tests/helpers/pglite-db.ts` with `section_progress`/`chapter_progress` tables (previously only used by query-layer tests, never by an action test). Extended `lib/curriculum/drills/generators.test.ts` with a sweep across the full `entryMultiple` (6 values) × `leverage`-roll (10 samples) domain asserting finite, positive MOIC/IRR — manually confirmed both new test suites fail without their respective fixes (reverted each fix locally, watched the new tests fail, restored). Verified: `pnpm typecheck` clean, `pnpm lint` clean (0 errors, 2 pre-existing unrelated React Compiler warnings), full `pnpm test` — **472/472 passing across 63 files**, no PGlite flake.

### Prod-readiness relay — correctness review fixes: Whisper usage logging, error-handling consistency, resume flag fallback, dead interview-mode validation (2026-07-18, session 7)

Fixed four findings from a correctness review, run concurrently with the session 6/8 chatbot work (touched no files under `app/(app)/tools/chatbot/**` or `tests/e2e/chatbot.spec.ts`):

- **Whisper spend was invisible.** `app/api/interview/transcribe/route.ts` and `app/api/whisper/transcribe/route.ts` called OpenAI Whisper (`whisper-1`) but never called `logUsage` — so the per-user monthly spend cap (`require-user.ts`'s `whisper` tier) never counted transcription cost. Both routes now log exactly one `ai_usage` row per successful upstream call: `{ model: "whisper-1", usage: { input_tokens: 0, output_tokens: 0 }, endpoint, userId, surchargeUsd: (durationSeconds / 60) * WHISPER_USD_PER_MINUTE }` — reusing the existing `surchargeUsd` flat-fee mechanism (same one `chat/assistant` uses for web-search billing) rather than adding a new cost path. `whisper/transcribe`'s upstream request format changed from `response_format: "text"` to `"verbose_json"` so it can read `duration` (matching what `interview/transcribe` already requested). A missing `duration` still logs a $0 row (row-count invariant over perfect cost). Removed the misleading token-priced `"whisper-1"` entry from `lib/ai/pricing.ts`'s `PRICING` table (Whisper is per-minute, not per-token) and added `WHISPER_USD_PER_MINUTE = 0.006` (OpenAI's published rate) as the source of truth instead.
- **Inconsistent error handling.** `app/api/relationships/structure-chat/route.ts` and `.../draft-followup/route.ts` called `client.messages.create` with no try/catch, unlike every sibling AI route (`interview/score`, `resume/critique`, `draft-outreach`). Wrapped both the same way: catch → `clientSafeError(route, err, "The AI request failed. Please try again.")` → 502. Also aligned `structure-chat`'s "model didn't call the tool" branch from 500 to 502, matching siblings.
- **Silent UI degradation.** `components/resume/resume-coach.tsx` indexed a strict `FLAG_LABELS` record with `weakness_flags` values, but the server schema (`lib/validation/schemas/resume.ts`) allows any string by design. An unrecognized flag now renders no badge instead of a blank one.
- **Dead validation.** `INTERVIEW_MODES` in `lib/validation/schemas/interview.ts` listed a 5th mode, `"markets"`, that no longer exists anywhere in the UI, `InterviewMode` (`lib/data/interview-questions.ts`), or seeded questions. Removed it from the Zod enum; left the `mock_interviews.mode` DB CHECK constraint (`supabase/migrations/0000_baseline.sql`) as-is since a superset there is harmless and narrowing it needs a migration — noted in a comment.

Tests: extended `tests/integration/api/interview/transcribe.test.ts` and `.../whisper/transcribe.test.ts` with usage-row-shape and missing-duration-fallback cases; extended `.../relationships/structure-chat.test.ts` and `.../draft-followup.test.ts` with an Anthropic-throws → 502 + server-side-log case (required lifting the inline `create: vi.fn()...` mocks to a shared `createMock` so tests can override per-call). Verified: `pnpm typecheck` clean, `pnpm lint` clean (0 errors, 2 pre-existing unrelated warnings), full `pnpm test` — **465/465 passing across 62 files**, no PGlite flake on this run.

### Prod-readiness relay — new-thread refresh flicker fix, issue 06 (2026-07-18, session 6)

Closed `.scratch/unit-9-chatbot-rebuild/issues/06-new-thread-refresh-flicker.md`: on a brand-new
thread, `key={active?.id ?? "new"}` in `page.tsx` remounted `AssistantChat` the moment
`router.refresh()` (called from the client's `onFinish`) caught up with the server-persisted
thread id — racing the just-streamed assistant reply (persisted in the route's `onEnd`) against
the refresh's `getMessages` read, so the reply could flicker out until the next navigation. Fix:
`page.tsx` now renders a new `ChatSession` wrapper (`_components/chat.tsx`) instead of keying
`AssistantChat` directly. `ChatSession` owns the mount key via a pure
`computeNextChatSessionState` transition function — a `null -> non-null` change in the active
thread id (the new thread's own id being confirmed) keeps the same mount key so
`AssistantChat` never remounts and the race is moot; any other transition (switching to a
different existing thread, or an explicit `?thread=new` reset) still gets a fresh mount key and
resets the composer as before. `router.refresh()` stays unchanged — the thread rail still
updates since `ThreadRail` is a sibling re-rendered from the same refreshed `page.tsx`. New test
`tests/components/chat-session.test.ts` (pure-function, 5 cases) covers the transition rule.
Verified: typecheck/lint clean, full vitest suite **463/463** passing, `pnpm test:e2e` under
CI's placeholder env still **1 passed / 10 skipped** (no regression — `chatbot.spec.ts`'s
existing golden path already asserts the URL/rail behavior this fix had to preserve).

### Prod-readiness relay — chat abort spend-cap fix + createThread race (2026-07-18, session 5)

A correctness review of the chatbot route found that a client disconnect
mid-stream skipped streamText's `onEnd` (it runs in the event-processor's
`flush()`, which never fires on cancel) — so the expensive sonnet call's
`ai_usage` row was never written while the partial reply still persisted and
the haiku title call still logged. Since `assertUnderQuota` sums `ai_usage`,
aborting requests bypassed the monthly spend cap. Fix: `void
result.consumeStream({ onError })` before returning the response — the SDK
tees the base stream, so draining the consume branch guarantees the usage log
regardless of client connection (verified against the installed v7.0.31
dist). Titling is now also skipped if the assistant persist failed
(`persisted` flag). Second fix: `createThread` gained
`onConflictDoNothing({ target: chatThreads.id })` — concurrent first POSTs
with the same client-generated threadId no longer 500/drop the user turn;
cross-user id-collision verified safe (RLS + per-query `user_id` predicates
mean an attacker posting a victim's threadId can neither create nor mutate
the victim's thread). Tests: consumeStream invoked + usage logged, titling
skipped on persist failure, duplicate-id createThread no-op that can't
transfer ownership. Suite 454 passing. Known residual (accepted): whether
full vs partial assistant text persists on a hard disconnect is still
timing-dependent — the guaranteed win is usage logging.

### Prod-readiness relay — LLM thread auto-titling (2026-07-18, cloud, branch `fable/prod-readiness`)

Closed the last Unit 9 deferral: chatbot threads were titled by truncating the
first user message to 60 chars (`app/api/chat/assistant/route.ts`). Now, on a
thread's first exchange only, `onEnd` (after the assistant turn persists)
best-effort calls `generateThreadTitle` (`lib/ai/chat-title.ts` — haiku,
plain-text output, sanitized via `sanitizeTitle`, never `JSON.parse`d) and
writes the result via the new `updateThreadTitle` query
(`lib/db/queries/chat.ts`, user-scoped like every other write there). A
failure is caught and logged (`console.error`, matching the sibling persist
catch two lines up) and the fallback title stands — chat responses never
break. No new route or rate limiter: it runs inside the already
`expensive`-tier-gated `chat/assistant` request, after the streamed response
is already in flight. One `ai_usage` row per title call
(`endpoint: "chat/assistant/title"`). The thread rail
(`_components/thread-rail.tsx`) needed no changes — it just renders whatever
title `listThreads` returns from the next server-rendered page load. Tests:
`tests/unit/lib/ai/chat-title.test.ts` (sanitizer), `updateThreadTitle` cases
in `tests/unit/lib/db/queries/chat.test.ts`, and three wiring tests in
`tests/integration/api/chat/assistant.test.ts` (new-thread titling,
no-op on follow-up turns, best-effort failure doesn't break the response).
Suite **454 passing** (was 451); typecheck/lint clean.

### Prod-readiness relay — session 4, UNIT 9 COMPLETE (2026-07-17, cloud, branch `fable/prod-readiness`)

All five Unit 9 issues shipped in one session — `/tools/chatbot` is now a real
product surface: streaming Claude chat with persistent threads (migration
`0010_chat_threads.sql` — **Jake applies, page 500s in prod until then**), tool use
over the user's own data with citation chips (hybrid semantic+keyword chat search),
a thread rail (switch/new/delete), Anthropic native web search with source links and
per-search cost tracking, and the "why JPM" firm-prep synthesis path (`get_firm`
fuzzy lookup + firm-scoped chat search + attribution prompt). Built on AI SDK v7
(PRD's v6 was stale). The parallel OpenAI chat stack was deleted. Suite
**390 passing**; build green. Deferred: e2e specs, firm_data pipeline, LLM thread
titles (~~done — see entry above~~). Session tail: Unit 8 scoped — issues 01–05 were already shipped by Unit 11,
so the session backfilled the missing 50 tests over qbank queries/actions instead
(suite **441 passing**); issue 06 + chat-onboarding brainstorm are triage-gated on
Jake. Next lanes: e2e coverage (fresh session), Jake's go-aheads.

### Prod-readiness relay — Phase 5, coverage lane (2026-07-18, branch `fable/prod-readiness`)

Raised real-behavior test coverage on the three lowest-covered, highest-risk modules
found via `pnpm test:coverage`: `lib/auth/middleware.ts` (0% → 100% stmts/lines/branches
— the `/api/*` 401 backstop, unauth/onboarding/landing redirect gating, and the
`@supabase/ssr` cookie getAll/setAll plumbing that keeps refreshed sessions from
randomly logging users out), `lib/db/queries/ai-usage.ts` (0% → 100% — PGlite-backed:
user isolation, `gte` date-boundary inclusivity, desc ordering, numeric→JS-number cost
mapping; this module backs both the `/dev/spend` dashboard and, transitively, the
monthly AI-spend cap gate), and `lib/data/contacts.ts` (35% → 100% — filled in the
previously-untested mutation paths: `createContact`, `upsertChatLog` insert/update
branches, `saveChatStructured`, `saveChatFollowUpDraft`, `touchContactLastContact`,
`updateContactStage`, plus two pre-existing error-path gaps in `getChatLogs`/
`getChatLogsForContact`). Added the `ai_usage` table to the shared `pglite-db.ts`
harness (now documented in its header comment) — reusable by future query tests.
No bugs found in these modules. Global coverage: statements 33.37%→36.34%, branches
28.89%→32.18%, functions 26.32%→28.77%, lines 33.19%→35.98%. Suite **472 → 521 passing**
(65 files, +2 new: `tests/unit/lib/auth/middleware.test.ts`,
`tests/unit/lib/db/queries/ai-usage.test.ts`). typecheck/lint/test all green.

### Prod-readiness relay — session 3, Phase 5 started (2026-07-16, cloud, branch `fable/prod-readiness`)

First Phase 5 slice: the follow-ups loop is now real end-to-end — chat summaries create
followup rows (deduped, unit-tested due-date normalization), the relationships widget
can mark them done, and the AI-drafted follow-up email persists to the chat log. All
three paths previously had zero callers/writers. Suite **362 passing**. Next-lane menu
for future sessions is in `context/relay/HANDOFF.md`.

### Prod-readiness relay — session 3, Phase 4 complete (2026-07-16, cloud, branch `fable/prod-readiness`)

Phase 4 **complete** in the same session: repo-wide prettier (CI's failing first gate),
`web/.env.example` regenerated from audited env reads and git-tracked, safe dep patches
(eslint-config-next / zod / supabase-js — next+react were already current), robustness
audit fixed the two real gaps (interview/score now Zod-parses LLM tool output — was an
uncaught-500 risk on the core scoring flow; extract-resume validates model JSON), stale
CONTRIBUTING.md env-var/branch names fixed, and a new integration test pins the
mid-stream error contract. Suite **354 passing**; all six CI steps verified green
locally. Next: Phase 5 (perpetual improvement).

### Prod-readiness relay — session 3, Phase 3 complete (2026-07-16, cloud, branch `fable/prod-readiness`)

Phase 3 **complete** — the session-2 backlog is closed (4 commits, suite **353 passing**):
relationships + firm pages now read real per-user data with genuine empty states (seed
arrays deleted); `/tools/relationships/new` is a real contact form (RHF + Zod →
`createContactAction`); pipeline stage changes persist (`updateContactStageAction`,
optimistic with revert); **chats actually persist now** — nothing ever wrote to the `chats`
table, so history/search/firm recall/embeddings ran on nothing; `logChatAction` +
`saveChatSummaryAction` fix that and activate the dormant pgvector embedding path
(prep sheets now use semantic recall over real past chats); the five streaming routes frame
mid-stream errors with a sentinel that clients render as styled errors with retry (instead
of `[Error: …]` prose in the assistant bubble); mock-studio aborts in-flight requests on
unmount. Filed to jakes-tasks: verify the production `firms` table is seeded. Next: Phase 4
(production-readiness checklist — `.env.example` regeneration, CI, dep patches, robustness).

### Prod-readiness relay — session 2, Phase 3 (2026-07-16, cloud, branch `fable/prod-readiness`)

Phase 3 (UX fixes & bugs) — **mostly complete** in the same session, 7 further commits, suite
now **346 passing** (vitest include fixed — colocated `lib/**/*.test.ts` like the mastery
model's tests silently never ran). Headliners: the app had **no navigation below `lg`**
(added top bar + Sheet drawer); a failed chapter-gate scoring rendered as "Gate passed /
chapter complete"; the gate was reachable without reading (disabled on an asChild Link is a
no-op); the product tour re-appeared forever on mobile; relationships AI actions showed
success toasts / blank emails on API failure; the progress page presented hardcoded +
Math.random() data as the user's real stats (rebuilt on topic_mastery/attempts with a tested
activity helper); ~20 medium/low fixes (timeouts, JSON guards, a11y, honest SOON labels,
error copy). Remaining backlog (relationships real-data slice, stage-change persistence,
chat-stream error protocol, abort-on-unmount) is documented in `context/relay/HANDOFF.md`.

### Prod-readiness relay — session 2 (2026-07-16, cloud, branch `fable/prod-readiness`)

Phase 2 (performance) of `context/RELAY-QUEUE.md` — **complete**, 8 commits pushed, every
commit gated on typecheck + lint + full vitest (+ build). Measured first: the latency story
was network round trips, not slow queries — 4 auth/PostgREST calls before page data (proxy
getUser + onboarding read, layout getUser, page getUser), 8 statements of `withUser`
transaction overhead, and serial per-page reads. Fixed: `withUser` 8→3 statements per
transaction (single set_config round trip, teardown dropped — transaction-local GUCs
auto-revert); `auth.getUser()` deduped per render pass with React `cache()`; proxy onboarding
read memoized in a user-scoped cookie (one-way flag); independent page reads pipelined via
Promise.all (postgres.js pipelines on one connection — dashboard 5→1 RTs, learn 3→1,
question-bank 3→1 + its second transaction folded in). Net: dashboard navigation ~17→~7
round trips. Authored `0009_perf_indexes_2.sql` (2 covering indexes, 10 prefix-redundant
drops, `ivfflat.probes=10` on the recall RPC) — apply filed to jakes-tasks. Added loading
skeletons to the 6 DB-backed routes that had none. Removed the dead `lib/cache` layer (zero
consumers, misleading comments). Audited prompt caching (invariant already satisfied) and
bundle (Sentry+zod dominate; documented, no safe Turbopack-compatible cut). Noted:
`lib/analytics/` is entirely unwired (provider never mounted) — future work.

### Prod-readiness relay — session 1 (2026-07-15, cloud, branch `fable/prod-readiness`)

Phase 1 (correctness & security hardening) of `context/RELAY-QUEUE.md` — most items done, all
pushed to `fable/prod-readiness` (12 commits), every commit gated on typecheck + lint + full
vitest (+ `pnpm build`). Highlights: the fix-first `lib/ai/usage.ts` lazy-thenable bug (cost
tracking never wrote rows) is fixed with a regression test; security response headers
(CSP/HSTS/XFO/nosniff/Referrer-Policy/Permissions-Policy) added; raw server error text no
longer leaks to clients (12 routes, new `lib/security/client-error.ts`); LLM tool _arguments_
and _outputs_ are Zod-validated (chat/general tools, structure-chat, draft-outreach,
resume/critique); the service-role `chat_embeddings` upsert now has an ownership check; AI
rate limiters fail closed on store errors; the monthly per-user AI spend cap ($20 default,
`AI_USER_MONTHLY_CAP_USD`) is enforced in `requireUser`; markdown renderer blocks
javascript:/data: links; 12 unused deps removed; Sentry build plugin wired; CI push trigger
fixed (`main`→`master`); Drizzle client made lazy so builds work without `DATABASE_URL`
(unblocks CI build); 4 blocking lint errors + 5 pre-existing test failures repaired
(suite: 325 passing, 0 failing). Details in `context/CHANGES.md`; state/baton in
`context/relay/HANDOFF.md`; three env/dashboard items filed to `context/jakes-tasks.md`
(Sentry env vars, CSP preview verification, spend-cap value).

Remaining Phase 1 (next session): middleware `/api/*` auth backstop (finding #1),
Next/React security patch bumps 16.2.6 / 19.2.6 (findings #6/#7 — also Phase 4),
guard `db:*` scripts (#9), spoofable `x-forwarded-for` IP key (#11), forged assistant
turns in chat schema (#13), `firm/prep` prompt isolation (#14), `ai_usage` null
`user_id` tightening (#16). The local-only `.scratch/code-review-2026-07/findings.md`
is NOT in the cloud clone — worked from `security-review-2026-06-01.md` instead.

### UI Revamp — "The Analyst's Desk" (2026-07-06, branch `design/ui-overhaul`)

- Full-app redesign replacing the emerald/Geist "modern edtech" language and the
  abandoned "ink" direction (old tip tagged `archive/ink-design`; branch was reset
  to master baseline first). New language documented in `ui-context.md` (rewritten):
  warm paper + blue-black ink + prospectus-blue accent, Newsreader/Schibsted
  Grotesk/IBM Plex Mono, hairline rules over shadows, mono "ledger" badges/eyebrows,
  6px radius, light-only (dead `.dark` token block + next-themes usage removed).
- Surfaces rebuilt or restyled: landing (prospectus structure; fabricated
  stats/testimonials/pricing removed), auth, onboarding, dashboard (real user name +
  date, was hardcoded "Jake"/"April 18"), learn (ruled index), Reading Lens, all
  tools, firms/sectors/profile/progress, loading skeletons, error pages. New shared
  `components/page-header.tsx`; sidebar shows SOON tags on unbuilt tools.
- Gate fix: `/` (marketing) is now public for signed-out users; signed-in users
  hitting `/` or auth routes go to `/dashboard` (`lib/auth/middleware.ts`).
- **Repo repair (same session):** the long-standing `git diff` mmap timeouts were
  caused by 41 iCloud-evicted (`dataless`) files in `.git/objects` + ~12 evicted
  source files. Quarantined dead objects, imported the GitHub pack, rebuilt master
  tip trees via temp-index `write-tree` (SHA-verified), restored working files.
- **Repo repair completed 2026-07-07:** the 12 unpushed master commits (whose
  intermediates referenced ~13 permanently-lost objects) were squashed into
  `15a4866` on top of origin `1a06923`; `design/ui-overhaul` rebased on top; both
  branches pushed to GitHub. Broken `archive/ink-design` tag + a superseded May-19
  stash deleted (approved); `git gc --prune=now` and `git fsck --full` pass clean.
- **Landing interactivity (2026-07-07, `2b0d8bf`):** new `components/marketing/`
  client components — `HeroDesk` (graph-paper grid, cursor crosshair with
  spreadsheet cell-ref readout, drifting ledger chips with mouse parallax; desktop
  pointer only), `LensDemo` (three hoverable highlights swap the plain-English
  margin card, auto-cycles until first interaction), `FirmTicker` (mono firm
  ticker, pauses on hover), `CountUp` hero ledger strip (16/05/01 — honest
  figures), `Reveal` (fade-up on first scroll into view). All motion inert under
  `prefers-reduced-motion`. New `ticker`/`chip-drift` keyframes in globals.css.

### Spec authoring (multi-session workflow)

- `project-overview.md` — product definition, 12 goals, core user flow, 16-chapter learning flow, six AI tools, scope cuts (jobs/community/mentors/flashcards), 14 success criteria.
- `architecture.md` — full stack table, system boundaries (learning flow spine + tools layered on top), storage model (Postgres + pgvector + Supabase Storage + Upstash Redis + MDX), auth and access (`user`/`admin`, RLS, profile-required/resume-optional onboarding, self-serve delete in phase 1), 10 architectural invariants.
- `ui-context.md` — modern edtech aesthetic, emerald accent, Geist Sans/Mono, light-only, full color tokens (oklch), border radius scale, shadcn `new-york`, layout patterns (incl. 3-column reader rule), Lucide icons, motion conventions.
- `code-standards.md` — TS strict + 3 extras, Server Action discriminated-union return shape, module-per-domain Drizzle queries, useState+URL+RSC state strategy, AppError hierarchy, pino structured logging, kebab-case files + PascalCase components, named exports, colocated Zod schemas, `@/` alias, light comments with section orientation, Tailwind tokens only, conventional commits.
- `ai-workflow-rules.md` — plan-first agent default, tracer-bullet vertical slices, protected files (`components/ui/*`, `lib/db/migrations/*`, `templates/context/*`, `.env*`), conventional commits + one-feature PRs, doc-sync responsibilities, six-gate "done" definition.
- Visual direction shotgun: 4 aesthetic HTML samples + 8 accent variants + 4 typography variants generated and shown for selection. Locked: modern edtech + emerald + Geist.
- Codebase audit against spec: ~50–60% aligned. Sentry, Upstash, PostHog, Pino, Supabase auth helpers, real DB tables, testing infra already in place.

### Decisions (locked in CHANGES.md)

- Stack vendors locked: Voyage `voyage-4-lite`, Groq Whisper Turbo, Inngest, Resend, direct Google Calendar OAuth.
- HireVue video back in phase 1 via MediaRecorder + Supabase Storage (raw `.webm`, 30-day retention).
- Migration strategy: in-place via tracer-bullet vertical slices.

### Unit 1 — Cleanup (completed 2026-05-19)

- Removed 24 ` 2.*` duplicate files (3 API routes, 2 lib/supabase, 5 lib/ai, 5 lib/data, 2 api/profile dirs, plus 7 coverage artifacts) plus 3 stale `coverage/* 2/` directories.
- Deleted cut-feature routes: `app/(app)/{community,jobs,network,pricing-analysis}` and their API: `app/api/applied-jobs/*`, `app/api/_debug/*`.
- Deleted cut-feature lib/data: `lib/data/applied-jobs.ts`, `lib/data/jobs.ts`.
- Removed `get_applied_jobs` tool from `lib/ai/assistant-tools.ts` (was exposed to chatbot — out of spec).
- Removed "Closing soon" jobs section from `app/(app)/dashboard/page.tsx` + the `seedJobs` import.
- Pruned sidebar nav (`components/app-nav.tsx`): dropped `/jobs`, `/network`, `/community` items + unused icon imports.
- Pruned marketing-page feature cards (`app/(marketing)/page.tsx`): dropped Job hub, Mentor marketplace, Peer community + "Mentor sessions at-cost" pricing line + unused icon imports.
- Deleted untracked debug files `_smoke.mts`, `lib/_smoke_test.ts` (one-off scripts).
- Fixed 22 pre-existing `react/no-unescaped-entities` lint errors across 11 files (apostrophes and double-quotes in JSX text → `&apos;`/`&quot;`). These were not introduced by Unit 1 but were blocking the verification gates.
- Cleaned `coverage/` directory (regeneratable; gitignored).
- **Verification:** `pnpm typecheck` ✅ clean, `pnpm lint` ✅ 0 errors (7 unused-var warnings remain — non-blocking), `pnpm build` ✅ successful.

### Unit 2 — Dependency parity (completed; commit `aef7a83`)

- Installed: `drizzle-orm`, `drizzle-kit`, `inngest`, `groq-sdk`, `googleapis`, `resend`, `@react-email/components`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `ai`, `@ai-sdk/anthropic`, `postgres`, `drizzle-zod`.
- **Known gap:** `voyageai` (the locked embeddings vendor) was NOT installed. Defer until embeddings work begins, or install in a follow-up. Tracked in Open Questions.

### Unit 5 — IA refactor / spine + tools (completed; commit `ee815e0`)

- Reshaped routing to the spine+tools IA: `app/(app)/learn`, `app/(app)/tools/{chatbot,question-bank,applications,resume-coach,story-framer,relationships,mock-interview}`, `app/(app)/sectors/[slug]`, plus `dashboard`, `firms`, `profile`, `progress`.
- Sidebar reorganized to match. No logic changes — pure route/nav reshape, which is why it was safe to land ahead of Units 3/4/6.

### Unit 3 — Drizzle wrap / read-only proof (completed 2026-06-02)

- **Connection:** `DATABASE_URL` (transaction pooler, 6543, `prepare:false`) for runtime, `DIRECT_URL` (session pooler, 5432) for schema ops — both `aws-1-us-east-2.pooler.supabase.com`. Env loaded into drizzle-kit via Node `--env-file=.env.local` (no `dotenv` dep).
- **Schema introspection:** `scripts/introspect.mjs` (custom postgres.js generator, `pnpm db:pull`) → `lib/db/schema/` for all 15 tables + `index.ts` barrel. Replaces `drizzle-kit pull`, which hangs against the Supabase pooler. Deterministic (no diff on re-run). Captures columns/types (incl. `text[]`, `vector(N)`), nullability, PKs, common defaults; FKs + indexes deferred.
- **Client + RLS:** `lib/db/client.ts` exports the singleton admin `db` and `withUser(token, fn)` — the hybrid wrapper (option 3) that sets `request.jwt.claims` + `set local role` per transaction so RLS applies. `Executor` type lets query fns take `db` or a tx.
- **Query + migration:** `lib/db/queries/profile.ts#getProfile(db, userId)` (Drizzle); the profile read in `app/api/chat/general/route.ts` now goes through `withUser → getProfile(tx, …)`. `lib/data/profile.ts` and its other callers untouched — both paths coexist.
- **Tests:** 3 Vitest unit tests for `getProfile` (empty-profile fallback, null-coercion, populated mapping) via a stub executor.
- **Verification:** introspection determinism ✅, typecheck ✅, lint ✅, unit tests ✅, `pnpm build` ✅. (`drizzle-kit pull`, the session pooler on 5432, and `pnpm build`/`tsc` all intermittently hit `os error 60`/ETIMEDOUT filesystem timeouts in this environment — transient, pass on retry.)

### Unit 4 — Auth UI + middleware + onboarding (completed 2026-06-12)

All surfaces specified in the unit-4 spec were already implemented (prior session). This session audited every file, fixed two test issues, fixed a build-time pre-render regression, and applied the DB migration file.

**Files confirmed complete (all pre-existing or completed this session):**

- `web/proxy.ts` — Next.js 16's `middleware.ts` equivalent; Supabase SSR session refresh + auth/onboarding gating. Already present.
- `web/lib/auth/middleware.ts` — `updateSession()` helper with full redirect logic. Already present.
- `web/lib/auth/server.ts` — `requireUser()`, `getCurrentUserOrNull()`, `UnauthorizedError`. Already present.
- `web/lib/auth/actions.ts` — `signOutAction()`. Already present.
- `web/lib/auth/action-result.ts` — discriminated-union `ActionResult<T>` type + `fieldErrorsFromIssues`. Already present.
- `web/lib/schemas/auth.ts` — `signUpSchema`, `signInSchema`, `requestPasswordResetSchema`, `resetPasswordSchema`, `onboardingSchema`, `SEMESTERS` enum (8 values), `GRAD_YEAR_RANGE`. Already present.
- `web/app/(auth)/layout.tsx` — bare auth layout. Already present.
- `web/app/(auth)/login/page.tsx` + `login-form.tsx` + `actions.ts` — `signInAction`, `signInWithGoogleAction`. Already present.
- `web/app/(auth)/signup/page.tsx` + `signup-form.tsx` + `actions.ts` — `signUpAction`. Already present.
- `web/app/(auth)/forgot-password/page.tsx` + `forgot-password-form.tsx` + `actions.ts` — `requestPasswordResetAction`. Already present.
- `web/app/(auth)/reset-password/page.tsx` + `reset-password-form.tsx` + `actions.ts` — `resetPasswordAction`. Already present.
- `web/app/(auth)/callback/route.ts` — OAuth code exchange; creates `profiles` row on OAuth signup. Already present.
- `web/app/(app)/onboarding/page.tsx` — single-page onboarding (4 fields). Already present.
- `web/app/(app)/onboarding/onboarding-form.tsx` — form with firm chip input + suggestion chips. Already present.
- `web/app/(app)/onboarding/actions.ts` — `completeOnboardingAction` (7-step skeleton, RLS-scoped via `withUser`). Already present.
- `web/lib/db/queries/profile.ts` — `setOnboarded(db, userId, fields)`. Already present.
- `web/lib/db/schema/profiles.ts` — `currentSemester` + `onboardedAt` columns. Already present.
- `web/components/app-nav.tsx` — sidebar nav with `SidebarProfileMenu` at bottom. Already present.
- `web/components/auth/sidebar-profile-menu.tsx` — avatar dropdown with Profile link + Logout. Already present.
- `web/components/auth/google-button.tsx` — Google OAuth button. Already present.
- `web/tests/unit/lib/schemas/auth.test.ts` — Zod schema rejection tests. Already present.
- `web/tests/unit/app/onboarding-action.test.ts` — UNAUTHORIZED gate test. Fixed: added `vi.mock("@sentry/nextjs")` and `vi.hoisted` for `withUserMock` (Sentry MCP transport was causing ETIMEDOUT at test module load).
- `web/tests/e2e/auth.spec.ts` — public gate + golden path e2e. Already present.

**Changes made this session:**

- `web/tests/unit/app/onboarding-action.test.ts` — fixed ETIMEDOUT by mocking `@sentry/nextjs`; fixed `vi.mock` hoisting error by using `vi.hoisted` for `withUserMock`.
- `web/app/(app)/layout.tsx` — added `export const dynamic = "force-dynamic"` (app layout calls `requireUser()` → static prerender fails at build).
- `web/supabase/migrations/0004_profiles_onboarding.sql` — created: adds `current_semester text` + `onboarded_at timestamptz` to `public.profiles` (idempotent); verifies `profiles_owner` RLS policy exists.

**DB note:** The remote Supabase instance is not reachable from this dev environment (DNS ENOTFOUND). Migration `0004_profiles_onboarding.sql` has been authored and committed. Apply it manually via the Supabase dashboard SQL editor or `pnpm db:migrate` from an environment with DB access.

**Ops note (IMPORTANT — must do before launch):** Re-enable Supabase email verification in the dashboard (Auth → Email). Currently disabled in dev so signup yields an immediate session. Leave off for development; turn on before production launch to prevent spam signups.

**Verification:** typecheck ✅, lint ✅ (0 errors, 8 pre-existing warnings), vitest 27/27 files, 196/196 tests ✅, build ✅.

**Playwright e2e:** authored (`tests/e2e/auth.spec.ts`); authed golden path skipped by default (`AUTH_SKIP_FLAG`); public gate test (redirect /dashboard → /login) requires a running server.

### Post-Units 4/6/7 — Security + Quality Review (completed 2026-06-13)

Addressed security and quality findings from the live security + engineering review:

- **R1 + R3 — Limiter degrade-open** (`lib/ratelimit/limiters.ts`): `makeSlidingWindow` now wraps `limiter.limit()` in try/catch. On any store error (DNS failure, timeout, etc.) it logs via `logger.error`, captures to Sentry, and returns `{ allowed: true }` — never throwing into a Server Action. Production-env misconfig (missing env vars) also emits a one-time Sentry alert.
- **R2 — Auth action rate limiting** (`app/(auth)/{login,signup,forgot-password}/actions.ts`): IP-keyed `authActionLimiter` (10 req/60s, degrade-open) added to all three unauthenticated auth actions before any Supabase call.
- **R4 — Migration 0005 idempotent** (`supabase/migrations/0005_applied_jobs_stage_align.sql`): wrapped `ADD CONSTRAINT applied_jobs_stage_check` in a DO block that checks `pg_constraint` first — safe to re-run on a DB that already has the constraint.
- **T1 — Error hierarchy consolidation** (`lib/auth/server.ts`, `lib/auth/action-result.ts`, `app/(app)/profile/actions.ts`, `app/(app)/tools/applications/actions.ts`): `lib/auth/server.ts` now re-exports `UnauthorizedError` from `lib/errors.ts` (canonical `AppError` subclass). Added `actionErrorFromAppError(err)` helper to `lib/auth/action-result.ts`. Actions now catch `AppError` + translate via the helper.
- **T3 — Notes max length single-sourced** (`lib/validation/schemas/applied-jobs.ts`, `app/(app)/tools/applications/actions.ts`): `NOTES_MAX_LENGTH = 5000` exported from shared schema; action imports and uses it.
- **T2 — PGlite-backed DB tests** (`tests/helpers/pglite-db.ts`, `tests/unit/lib/db/queries/applications.test.ts`, `tests/unit/lib/db/queries/profile.test.ts`): installed `@electric-sql/pglite`; created in-memory Drizzle harness; rewrote both query test files to run against real SQL. Two-user isolation tests prove WHERE clauses actually filter.

**Verification:** typecheck ✅, lint ✅ (0 errors, 9 pre-existing warnings), vitest 30 files / 239 tests ✅, build ✅.

### Curriculum & learning workflow design (completed 2026-07-12)

- **`context/curriculum.md`** authored — the full chapter-by-chapter curriculum: uniform chapter anatomy (sections → drills → interactive tutorial → ~85% mastery gate → interleaved review pool), section breakdowns for all 16 chapters, spine-vs-reference chapter split (Firms/Sectors are reference, no gate), AI-grading design (6 question types, 5 published rubric dimensions incl. depth calibration, follow-up trees, parameterized generators), three timeline entry paths (foundation / accelerated / interview mode), and the 32-MDX-guide → chapter mapping.
- Grounded in: content inventories of the 30 PDFs in `extra_content/` (7 BIWS course modules, 8 BIWS/M&I topic guides ≈ 600+ Q&A taxonomy, 6 behavioral guides, M&I 400 Questions ×2, 4 personal docs incl. the Kozower prep binder) + web research on competitor curricula, the 2025–26 accelerated timeline, learning science (retrieval/spacing/interleaving/worked examples/mastery gates), and AI-grading competitors.
- **Copyright posture set** (curriculum.md §7): commercial BIWS/M&I material = taxonomy/sequencing reference only, all shipped content authored originally; personal friend docs = design inputs pending permission (logged in jakes-tasks.md).
- **Resolves the open question** on chapter-structure migration: keep guides as the reading unit, reorganize under chapters as section seeds, author the gap sections (biggest gaps: ch. 1–2, ch. 8 §5–8, ch. 14).

### Unit 11 — Learning-flow curriculum + Question Bank (completed + verified live 2026-07-12)

Full implementation of the curriculum + daily workflow so a new user is carried end-to-end. Code + content complete, migrations applied live, toolchain verified, production deployed.

**Curriculum spine (static):**

- `lib/curriculum/chapters.ts` — 16-chapter manifest (sections, slugs, spine-vs-reference kind, gated flag, per-chapter tool exercise, ⭐ advanced sections). `GATE_PASS_THRESHOLD = 0.85`.
- `lib/curriculum/progress.ts` — pure `computeFlow()` deriving next-up + per-chapter status from progress rows.
- `lib/curriculum/cycle.ts` — recruiting-cycle widget logic (semester → foundation/accelerated/interview path + focus).
- `lib/curriculum/drills/generators.ts` (+ test) — parameterized 3-statement / TSM / accretion-dilution / paper-LBO drills, random each round, locally checked.

**Content generated (parallel Sonnet workflows):**

- **~65 new section MDX readings** in `content/guides/` (all 97 manifest sections now have a file). Written as original prose from PDF facts/coverage/sequencing per Jake — no BIWS/M&I text, names, or worked numbers reused (curriculum.md §7). First workflow stalled on iCloud FS read-timeouts mid-run (killed the question phase, left 10 guides unwritten); recovered with a **write-only** workflow (all data embedded in prompts, zero source reads) — 22/22 agents succeeded.
- **532 AI-graded questions + 1,199 follow-ups** in `lib/curriculum/seed/questions/*.json`, tagged with manifest chapter/section slugs, difficulty, rubric key points, misconceptions, model answers, follow-up trees. Gated technical chapters (8–13) have 40–71 non-advanced questions each; thin coverage only in ungated recruiting/firms/sectors reference chapters.

**Data + queries:**

- Migration `0006_curriculum.sql` — `qbank_questions`/`qbank_followups` (shared, read-only), `qbank_attempts`/`qbank_spaced_state`/`topic_mastery`/`section_progress`/`chapter_progress` (RLS owner-scoped), `profiles.advanced_track`.
- `scripts/build-qbank-seed.mjs` → `0007_qbank_seed.sql` (generated; validates every question against the manifest, idempotent `on conflict do nothing`).
- Drizzle schema `lib/db/schema/{qbank,curriculum-progress}.ts` + `profiles.advancedTrack`; queries `lib/db/queries/{qbank,curriculum}.ts` (pick/serve, section-drill/gate/interleaved selection, due-review, attempts, spaced state, mastery upsert).

**AI grading (published rubric):**

- `lib/ai/grading.ts` — Sonnet tool-use grades key points (weighted) + misconceptions + **depth calibration**; returns the full rubric to the user. `lib/mastery/mastery.ts` (+ test) — EWMA mastery + 2–3-day spaced re-surfacing until answered correct twice.
- Server Actions (7-step skeleton, rate-limited, RLS-scoped): `tools/question-bank/actions.ts` (`gradeAnswerAction`, `serveQuestionAction`), `learn/actions.ts` (`markSectionReadAction`, `finishSittingAction`, `completeUngatedChapterAction`). New limiters: `qbankGradingLimiter`, `curriculumProgressLimiter`.

**UI:**

- `/learn` chapter grid (continue-where-you-left-off), `/learn/[chapter]`, `/learn/[chapter]/drill/[section]`, `/learn/[chapter]/practice` (gate). Question Bank studio (daily interleaved drill + due queue, practice-by-topic, mental-math generators). Dashboard rebuilt on real data (cycle widget, weak areas, due count, continue-flow). Advanced-track toggle in onboarding + profile (schema, action, `setOnboarded`/`updateProfile` all wired). Section reading reuses the existing `/guide/[slug]` Reading-Lens reader.

**✅ Verified live (2026-07-12):** repo moved out of iCloud to `~/Developer/InterviewPrep` (root cause of the prior `ETIMEDOUT` toolchain failures — confirmed, `pnpm install`/`typecheck` now run clean). Migrations `0006`/`0007` applied via `supabase db query --linked` (dashboard SQL editor rejected 0007 as too large): `qbank_questions` = 532 rows, `qbank_followups` = 1,199 rows. `pnpm typecheck` caught 3 real type errors (dashboard weak-topics lookup, question-bank topic-predicate, onboarding `advancedTrack` zod `.default()` diverging resolver input/output types) — fixed in commit `18dabe3`. Vercel Root Directory was fixed to `web` by Jake; production deploy is green (`dpl_7CkHvXL2a55ZKnFJT7zBmDb79ims`).

### Chapter 10 (Valuation) gap sections authored (completed 2026-07-12)

- Wrote 3 missing `content/guides/*.md` sections referenced in `lib/curriculum/chapters.ts`'s `valuation` chapter: `metrics-and-multiples.md` (EBIT/EBITDA/net income/FCF, multiples-as-Value=CF/(r-g)-shorthand, two-company margin worked example), `football-field-and-interpretation.md` (assembling comps+precedents+DCF into a range, valuation-hierarchy-by-context, worked football-field example), `other-methodologies-and-sector-multiples.md` (advanced/elective: SOTP, liquidation/NAV, M&A premiums analysis, LBO-as-floor, sector multiples survey — EBITDAR/EBITDAX/FFO/AFFO/P-TBV/per-subscriber).
- Sourced from commercial prep-guide extracts for facts/sequencing only per sourcing rules in curriculum.md §7 — all prose and worked-example numbers original, no named case studies or vendor references carried over.
- Chapter 10 (`valuation`) now has all 6 sections in `chapters.ts` present as guide files. Chapters 9 and 11 (`ev-equity-value`, `dcf`) remain fully covered from prior work; other chapters' gaps (ch. 1–2, ch. 8 §5–8, ch. 14) still open per curriculum.md §6.

### E2E: deferred golden-path specs + storageState plumbing (2026-07-18, session 5)

- **`tests/e2e/global-setup.ts`** (new, wired via `globalSetup` in `playwright.config.ts`): signs in through the real `/login` form and saves `tests/e2e/.auth/user.json` (gitignored) — but only when `STREETPREP_E2E_AUTH=1` and `STREETPREP_E2E_EMAIL`/`STREETPREP_E2E_PASSWORD` are all set; no-ops otherwise (today's CI default), so it adds zero cost to the unauthed run.
- **`tests/e2e/chatbot.spec.ts`** (new): the "why JPM" golden path from Unit 9's PRD — `/tools/chatbot?thread=new` → send → mocked assistant reply renders → URL gains `?thread=<uuid>`; a second test checks the thread rail gets an entry. Mocks `/api/chat/assistant` via `page.route` with a hand-built AI SDK **v7.0.31** UI-message-stream (SSE `data: <json>\n\n` chunks — `start`/`start-step`/`text-start`/`text-delta`/`text-end`/`finish-step`/`finish`, then `data: [DONE]`; format verified against `node_modules/ai/dist/index.js`, not training data), so it never needs `STREETPREP_E2E_LIVE_AI`.
- **`tests/e2e/question-bank.spec.ts`** (new): drives the "By topic" tab — `serveQuestionAction` is a pure DB read (no AI), so the spec serves a question and proves the "Submit for grading" button enables on input, without ever calling `gradeAnswerAction` (that hits Claude). Added `data-testid="qbank-topic-<value>"`/`qbank-difficulty-<value>`/`qbank-serve-button` to `components/learn/question-bank-studio.tsx` (attribute-only).
- **`tests/e2e/_helpers.ts`** gained `AUTH_STORAGE_STATE_PATH`, `buildUiMessageStream()`, `UI_MESSAGE_STREAM_HEADERS`.
- Wired the previously-inert `storageState` into the five _existing_ authed specs that assumed a logged-in session but never had one (`profile.spec.ts`, `applications.spec.ts`, `interview.spec.ts`, `resume.spec.ts`, the authed describe in `chat.spec.ts`) via `test.use({ storageState: AUTH_STORAGE_STATE_PATH })` scoped inside each gated `describe` — `auth.spec.ts` untouched on purpose (its public redirect test and self-contained signup golden path must stay unauthed).
- Verified: typecheck/lint/prettier clean; `pnpm test:e2e` under CI's placeholder env → **1 passed, 10 skipped** (was 1 passed / 6 skipped). CI has no auth secrets yet, so these specs stay skipped there by design — filed to `jakes-tasks.md` (optional, not blocking) with the exact secrets + workflow edit needed to actually run them.
- Full detail + rationale in `context/relay/HANDOFF.md`'s 2026-07-18 session-5 entry.

## In Progress

- Nothing active in code. **PRDs + tracer-bullet issues for Units 8–10 are written and ready** (2026-07-07) in the local-markdown tracker:
  - `.scratch/unit-8-question-bank/` — PRD + 6 issues (schema/seed/browse → grading → follow-up tree → spaced re-surfacing → mastery → AI-generated questions [needs-triage]).
  - `.scratch/unit-9-chatbot-rebuild/` — PRD + 5 issues (streaming chat w/ persistence → tool use → web search → firm-data + "why JPM" golden path → thread management).
  - `.scratch/unit-10-calendar-sync/` — PRD + 4 issues (OAuth connect → event sync → contact auto-link → webhook + Inngest bootstrap).
  - Each issue is a vertical slice with `Status:`/`Blocked by:` per `docs/agents/issue-tracker.md`. Implement each in a fresh session, per issue, in DAG order.

## Next Up

Each unit has a dedicated spec file in `context/feature-specs/`. Read that spec before planning the unit's implementation.

> Units 1, 2, and 5 are done — see Completed. Unit 3 is In Progress. The remaining foundation backlog is below.

### Unit 6 — Server Action pattern proof

Spec: [`context/feature-specs/unit-6-server-action-pattern.md`](feature-specs/unit-6-server-action-pattern.md)

Summary: migrate `POST /api/profile/save` to a `saveProfileAction` Server Action that implements the 7-step skeleton from `code-standards.md`. Becomes the canonical reference for future migrations.

### Unit 6 — Server Action pattern proof

Spec: [`context/feature-specs/unit-6-server-action-pattern.md`](feature-specs/unit-6-server-action-pattern.md)

Summary: migrate `POST /api/profile/save` to a `saveProfileAction` Server Action that implements the 7-step skeleton from `code-standards.md`. Becomes the canonical reference for future migrations.

### Unit 6 — Server Action pattern proof (completed 2026-06-13)

`saveProfileAction` at `web/app/(app)/profile/actions.ts` is the canonical 7-step Server Action reference. Key deliverables:

- **`lib/errors.ts`** — AppError hierarchy: `ValidationError`, `UnauthorizedError`, `NotFoundError`, `RateLimitedError`, `LLMError`, `ExternalServiceError`.
- **`lib/ratelimit/limiters.ts`** — `profileMutationLimiter` (Upstash sliding window, 60 req/min), reusing existing `lib/security/redis.ts` Redis client.
- **`lib/db/queries/profile.ts`** — `updateProfile(db, userId, fields)` added (upsert, all editable columns, camelCase→Drizzle schema columns).
- **`app/(app)/profile/actions.ts`** — `saveProfileAction` with colocated `saveProfileSchema` (Zod, strict). Full 7-step skeleton. Top-of-file canonical pattern comment.
- **`app/(app)/profile/page.tsx`** — server component; loads profile via `withUser → getProfile`; renders `ProfileEditForm`.
- **`components/profile/profile-edit-form.tsx`** — RHF + Zod client form; `useTransition` + `startTransition` for pending state; sonner toasts for success/rate-limit; inline fieldErrors; UNAUTHORIZED redirects to `/login?next=/profile`.
- **`app/api/profile/save/route.ts`** — DELETED. Server Action replaces it. No remaining callers (integration test also deleted).
- **`tests/unit/app/profile-action.test.ts`** — 7 tests: schema valid/invalid, UNAUTHORIZED gate, RATE_LIMITED gate.
- **`tests/unit/lib/db/queries/profile.test.ts`** — 3 new tests for `updateProfile` (camelCase pass-through, undefined fields excluded, empty-row fallback). Prior 3 `getProfile` tests preserved.
- **`tests/e2e/profile.spec.ts`** — updated to expect Server Action flow (sonner toast, `router.refresh()`) instead of `fetch('/api/profile/save')` interception.
- **`tests/integration/api/profile/save.test.ts`** — DELETED (route gone).

**Verification:** typecheck ✅, lint ✅ (0 errors, 9 pre-existing warnings), vitest 28 files / 209 tests ✅, build ✅.

**Playwright e2e:** updated; requires `STREETPREP_E2E_AUTH=1` to run; skipped by default in CI.

**`requireUser` reconciliation:** used `lib/auth/server.ts#requireUser()` (Unit 4, throws `UnauthorizedError`). Legacy `lib/security/require-user.ts` (Route Handler gate) untouched.

**Rate limiter:** reused `lib/security/redis.ts#getRedis()` and `@upstash/ratelimit` (already installed). New module `lib/ratelimit/limiters.ts` — no new Redis client.

### Unit 7 — Application Tracker (completed 2026-06-13)

Full CRUD feature for personal job-application tracking, built on the patterns from Units 3/4/6.

**Files created/modified:**

- `lib/db/queries/applications.ts` — `getApplications`, `getApplicationById`, `createApplication`, `updateApplication`, `deleteApplication` (Drizzle, `(db, ...args)` pattern).
- `app/(app)/tools/applications/actions.ts` — three Server Actions following 7-step skeleton: `createApplicationAction`, `updateApplicationAction`, `deleteApplicationAction`. Colocated Zod schemas.
- `app/(app)/tools/applications/page.tsx` — server component; loads applications via `withUser → getApplications`; reads `searchParams.stage`; renders filter + list.
- `app/(app)/tools/applications/_components/application-form.tsx` — client, RHF + Zod, submits to `createApplicationAction`.
- `app/(app)/tools/applications/_components/application-row.tsx` — single row with inline stage edit + delete button.
- `app/(app)/tools/applications/_components/stage-filter.tsx` — stage chips, URL-state via searchParams + Link.
- `lib/ratelimit/limiters.ts` — added `applicationsLimiter` (120 req/min; no AI calls).
- `lib/ai/assistant-tools.ts` — re-added `get_applied_jobs` tool + execute handler; now routes through Drizzle `getApplications`.
- `supabase/migrations/0005_applied_jobs_stage_align.sql` — aligns stage CHECK constraint from legacy set to spec set (see schema diff section below).
- `tests/unit/lib/db/queries/applications.test.ts` — stub-executor tests: mapping, null coercion, isolation, create, delete.
- `tests/unit/app/applications-action.test.ts` — schema rejects invalid URL/missing firm/overlong notes; UNAUTHORIZED gate; RATE_LIMITED gate; NOT_FOUND on update/delete.
- `tests/unit/lib/ai/assistant-tools.test.ts` — added `get_applied_jobs` mock + 4 new tests (grouping, stage filter, zero-app, invalid stage).
- `tests/e2e/applications.spec.ts` — golden path: add → appears → filter → hidden → clear → stage edit → delete → gone.

**Schema diff:** real DB had stage values `bookmarked | applied | screen | interview | superday | offer | rejected`; spec wants `shortlist | applied | interview | superday | offer | rejected`. Migration authored to rename `bookmarked→shortlist`, `screen→interview`, drop old CHECK, add new CHECK. Also sets `updated_at DEFAULT now()`. See `supabase/migrations/0005_applied_jobs_stage_align.sql`.

**RLS:** `applied_jobs_owner` policy (`USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`) is confirmed in `supabase/migrations/0000_baseline.sql`. Explicitly verify in the Supabase dashboard after applying migrations (see jakes-tasks.md).

**Sidebar:** "Applications" entry with `Briefcase` icon was already present in `components/app-nav.tsx` from Unit 5. Not duplicated.

**Verification:** typecheck ✅, lint ✅ (0 errors, 9 warnings — all pre-existing), vitest 30 files / 236 tests ✅, build ✅. Playwright e2e authored; requires `STREETPREP_E2E_AUTH=1` + storageState (skipped by default in CI).

### Unit 8+ — Remaining feature backlog

- **Unit 8:** Q-Bank tracer-bullet — **PRD + issues ready:** `.scratch/unit-8-question-bank/`.
- **Unit 9:** Chatbot rebuild with tool use — **PRD + issues ready:** `.scratch/unit-9-chatbot-rebuild/`.
- **Unit 10:** Calendar OAuth + auto-link — **PRD + issues ready:** `.scratch/unit-10-calendar-sync/`. Blocked on Jake's Google Cloud + Inngest setup (see `jakes-tasks.md`).
- Migration numbering is coordinated across the three PRDs: `0006` qbank, `0007` chat threads, `0008` google calendar, `0009` contacts email. If units land out of order, renumber at implementation time.
- Later candidates (not yet PRD'd): prep-sheet generation (depends on Unit 10), firm_data refresh pipeline, Reading Lens migration to `api/lens/*`, AI-quiz onboarding flow (from `todo.md`), dashboard weak-areas widget (reads Unit 8's `topic_mastery`), app-wide loading-time pass (from `todo.md`).

## Open Questions

- **`voyageai` not installed:** Unit 2 installed every other locked dependency but missed the Voyage embeddings SDK. Install it when embeddings work starts (chatbot/semantic-recall units), or as a quick follow-up to keep dependency parity honest.
- ~~**Drizzle connection string** / **introspect vs schema-first**~~ — RESOLVED in Unit 3 (2026-06-02). `DATABASE_URL`/`DIRECT_URL` are set; introspect-first won, via a custom postgres.js generator (`drizzle-kit pull` hangs on the pooler). See CHANGES.md.
- **Drop cut tables:** the `jobs` and `applied_jobs` tables still exist in the DB (Unit 1 only removed app code). Schedule a drop migration when Drizzle-managed migrations come online.
- **Toolchain FS timeouts:** `drizzle-kit pull`, the 5432 session pooler, and `pnpm build`/`tsc` intermittently fail with `os error 60`/ETIMEDOUT filesystem timeouts in this environment. Transient — they pass on retry — but worth watching if they worsen.
- **Inngest in production:** confirm sticking with hosted Inngest vs eventually self-hosted queue. (From CHANGES.md.)
- ~~**Chapter structure migration**~~ — RESOLVED 2026-07-12 in `context/curriculum.md` §6: keep guides as the reading unit, reorganize them under chapters as section seeds, author the missing sections (no from-scratch rewrite). Full mapping table in that doc.
- **Drizzle introspection vs schema-first:** introspect existing Supabase tables and accept their current shapes, or write the full target schema in Drizzle and migrate the DB to match? Likely answer: introspect first to avoid downtime, then evolve.
- **Embeddings migration:** how to handle existing chat embeddings (if any) when switching from OpenAI to Voyage. Backfill job via Inngest, or just re-embed lazily on next access?
- **Existing Reading Lens UI nuances:** the 3-column layout fix is important (documented as an invariant). What other non-obvious lessons from the prototype should the migration preserve?
- **ESLint coverage scope:** lint currently scans `coverage/` and `tests/` files when they exist locally. Consider adding `coverage/**` to `eslint.config.mjs` `globalIgnores` so re-running tests doesn't reintroduce lint noise. (Surfaced during Unit 1; deferred — not blocking.)
- **JSX text style:** Unit 1 fixed unescaped apostrophes via `&apos;`. Long-term, consider using Unicode typographic quotes (`'`, `"`) for nicer rendering; either way commit to one style.
- **AI Chat sidebar entry:** the AI chat currently lives only as embedded chat in the Reading Lens (right rail of guide reader). No standalone `/chat` or `/tools/chatbot` page exists yet. The new spine+tools IA (Unit 5) introduces `/tools/chatbot` as a first-class sidebar surface; the standalone tool-using chatbot rebuild lands after that.

## Architecture Decisions

See `templates/CHANGES.md` for the complete, time-stamped log. High-impact decisions in brief:

- **Spine + tools IA** instead of flat feature siblings.
- **Server Actions for mutations**, Route Handlers for streaming + webhooks only.
- **Drizzle on top of Supabase Postgres** with module-per-domain queries; pgvector in-DB.
- **In-place migration** strategy (vs greenfield rebuild) because ~50–60% of the spec stack is already installed.
- **Light comments + section orientation** policy (not minimal-only, not heavy JSDoc).
- **AppError hierarchy + Sentry capture** + discriminated-union Server Action return shape.

## Spec workflow

Each unit (foundation and feature) now has a dedicated spec file in `context/feature-specs/`. The template is `_TEMPLATE.md`. Order of operations:

1. **Spec drafted** (in `context/feature-specs/unit-N-<slug>.md`) — co-authored with the user via AskUserQuestion to lock decisions.
2. **Spec approved** — status `Approved` in frontmatter.
3. **Plan-and-execute** per `ai-workflow-rules.md`, plan references the spec.
4. **During implementation**, decisions that surface get reflected back into the spec + logged in `CHANGES.md`.
5. **On completion**, spec status flips to `Complete` and `progress-tracker.md` Completed section gets the unit's bullet.

## Session Notes

- **Multi-session workflow.** The spec files were authored over multiple Claude Code sessions. Each session built one file with the user's input via AskUserQuestion. The user explicitly prefers many small focused questions over big open-ended ones.
- **`templates/CHANGES.md`** is the running decision log. Every meaningful spec change has a date and rationale there. Always update it when changing a spec file.
- **`templates/samples/`** holds visual direction HTML samples. Useful future reference if the brand visual direction needs to be revisited.
- **`templates/HANDOFF_architecture.md`** was a handoff prompt used to bootstrap one session — can be deleted now that all spec files are done, or kept as a workflow reference.
- **Current branch is dirty** with mostly ` 2.ts` duplicates and some uncommitted UI work. Unit 1 cleans this up.
- **Test the migration**: before merging any unit, run `pnpm typecheck`, `pnpm lint`, the relevant Vitest tests, and `pnpm build`. Playwright e2e on critical flows once those flows exist.
- **Future-self reminder**: the spec is the source of truth. If something in the codebase contradicts a spec file, the spec wins by default — and if the spec is wrong, change the spec first, then the code (per `ai-workflow-rules.md`).

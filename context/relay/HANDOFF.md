# StreetPrepAI relay — baton / handoff

> You are one session in a standing relay making StreetPrepAI production-ready. Read
> `context/RELAY-QUEUE.md` (the work order) and follow its universal rules. Work on
> branch `fable/prod-readiness` — NEVER master. Don't stop at a phase boundary; keep
> going to the next item while budget remains. Update this file every session.

## Phase checklist

- [x] Phase 1 — Correctness & security hardening — **DONE** (session 1). Fix-first
  usage.ts bug ✅, security headers ✅, error-leak sweep ✅, LLM tool arg+output Zod ✅,
  service-role ownership check ✅, AI limiters fail-closed ✅, spend cap wired ✅, markdown
  href guard ✅, unused deps ✅, Sentry plugin ✅, `/api/*` proxy auth backstop ✅ (#1),
  next 16.2.10 + react 19.2.7 ✅ (#6/#7), `db:*` script guard ✅ (#9), earnings-text
  prompt isolation ✅ (#14). Deferred Lows (accepted, revisit only if priorities change):
  #13 client-supplied assistant turns — inherent to the stateless chat API; #11 XFF IP
  key — platform-managed on Vercel; #16 `ai_usage.user_id` nullable — needs a
  backfill-aware migration file.
- [x] Phase 2 — Performance — **DONE** (session 2). The latency was network round trips:
  withUser overhead 8→3 statements/txn ✅, getUser deduped via React cache() ✅, proxy
  onboarding read memoized in a user-scoped cookie ✅, page reads pipelined with
  Promise.all (postgres.js pipelines; dashboard ~17→~7 RTs/navigation) ✅, question-bank
  double transaction folded ✅, migration `0009_perf_indexes_2.sql` authored (2 covering
  indexes, 10 prefix-redundant drops, ivfflat probes=10) — **Jake applies** ✅, loading
  skeletons on all 6 DB-backed routes that lacked one ✅, dead `lib/cache` removed ✅.
  Prompt-caching invariant verified satisfied (OpenAI routes cache automatically; the
  uncached Anthropic prompts are <1K tokens). Bundle measured: Sentry (incl. Replay,
  deliberate) + zod v4 dominate; Turbopack supports neither the analyzer nor Sentry
  treeshake options — documented in CHANGES.md, not changed.
- [x] Phase 3 — UX fixes & bugs — **DONE** (sessions 2+3). Session 2: screen-by-screen
  sweep, ~27 fixes (mobile nav, gate scoring, tour, progress page fabrication, vitest
  include; see CHANGES.md). Session 3 closed the backlog: relationships + firm pages
  wired to real per-user data with genuine empty states (seed arrays deleted) ✅, real
  /new contact form (RHF+Zod → createContactAction) ✅, pipeline stage changes persisted
  (optimistic + revert) ✅, **chats now actually persist** (nothing ever wrote to `chats`;
  logChatAction saves notes before the AI call, saveChatSummaryAction persists the
  validated summary, structure-chat now gets contactId+chatId so the embedding path
  finally runs; prep-person gets contactId → semantic recall live) ✅, stream mid-error
  sentinel (ASCII record-separator framing via lib/streaming/stream-error + shared streamTextResponse;
  5 routes, 4 clients render styled role=alert + retain partial content) ✅, mock-studio
  abort-on-unmount ✅.
- [x] Phase 4 — Production-readiness checklist — **DONE** (session 3). `.env.example`
  regenerated from an audit of every `process.env` read and git-tracked
  (`!.env.example` exception) ✅; repo-wide prettier applied — format:check was failing
  on 89 files and is CI's first gate; all six CI steps verified green locally ✅;
  deps: next/react already current, bumped eslint-config-next 16.2.10, zod 4.4.3,
  supabase-js 2.110.7 (each verified) ✅; robustness audit → interview/score now
  Zod-parses tool output (was the ONLY tool-call route that didn't — non-array rubric
  = uncaught 500 on the core scoring flow) and extract-resume validates model JSON
  before returning ✅; CONTRIBUTING.md stale env-var name + main→master fixed ✅;
  Confirm-email toggle already in jakes-tasks ✅. Accepted-low: whisper transcribe
  `as`-casts its verbose_json response (degrades via ?? fallbacks — documented, not
  changed).
- [~] Phase 5 — Perpetual improvement — **in progress** (session 3 started it).
  Done: follow-ups loop closed (session 3); **UNIT 9 COMPLETE — all five issues**
  (session 4, see log); **Unit 8 scoped + its test debt closed** (session 4 —
  issues 01–05 were already shipped by Unit 11; read `.scratch/unit-8-question-bank/
  SCOPING-2026-07-17.md` before touching qbank). **Good next lanes (session 5+)**:
  (1) e2e coverage — playwright specs for the chatbot golden path ("why JPM",
  mocked LLM) + question bank, `STREETPREP_E2E_AUTH=1`, best started with fresh
  context; (2) Jake-gated go-aheads once answered in jakes-tasks: Unit 8 #06
  (AI-generated questions), chat-driven onboarding (brainstorm 2026-07-17),
  PostHog wiring (`lib/analytics/` still unmounted — product decision);
  (3) Unit 10 calendar sync stays BLOCKED on Google Cloud creds (jakes-tasks);
  (4) smaller: LLM thread auto-titles, firm_data refresh pipeline (own unit).

## Blockers

- `.scratch/code-review-2026-07/findings.md` is LOCAL-ONLY on Jake's machine — it does not
  exist in cloud clones (gitignored). Session 1 worked from `security-review-2026-06-01.md`
  (repo root; note: it contains stray null bytes — read via `tr -d '\0' <file>`). Its
  findings index + "Suggested fix order" is the working list; statuses above reflect it.

## Facts the next session should know (verified in session 1)

- Suite baseline: **325 tests passing, 0 failing**; lint 0 errors / 6 pre-existing warnings;
  `pnpm build` exits 0 (check real exit codes — piping to `tail` eats them).
- Two rate-limit stacks coexist on purpose: `lib/security/*` (Route Handlers, via
  `requireUser(req, {tier, route})`) and `lib/ratelimit/limiters.ts` (Server Actions).
  Store-failure policy is now split: AI limiters deny, auth/CRUD allow.
- `requireUser` now also enforces the monthly AI spend cap (default $20,
  `AI_USER_MONTHLY_CAP_USD`); route tests that don't mock `@/lib/ai/usage` fall through to
  the admin-client-null path (allows) — mock `assertUnderQuota` in new route tests.
- `lib/db/client.ts` exports `getDb()` (lazy), not `db`. `withUser` is the user-facing path.
- Jake tasks filed: Sentry env vars, CSP verification on first preview deploy, spend-cap value.

## Session log

- **2026-07-18 (session 5, cloud, checkpoint 2 — all landed work committed)** — Phase 5.
  Committed this session (9 commits, all pushed): architecture.md embeddings drift;
  playwright `webServer` (e2e self-sufficient, CI e2e was unrunnable before);
  **LLM thread auto-titling** (haiku in `chat/assistant` onEnd, best-effort,
  sanitized plain text, one ai_usage row `chat/assistant/title`, user-scoped
  `updateThreadTitle`; suite 454); e2e golden-path specs commit (chatbot mocked-LLM
  "why JPM" + question-bank smoke + storageState global-setup — the sub-entry
  below is now COMMITTED, ignore its "left uncommitted" tail); firm_data refresh
  brainstorm (`context/brainstorms/2026-07-18-firm-data-refresh.md`) + Jake
  questions filed; chatbot flicker race filed as
  `.scratch/unit-9-chatbot-rebuild/issues/06-new-thread-refresh-flicker.md`
  (ready-for-agent, low); **fix(chatbot) abort/spend-cap** — an opus review
  CONFIRMED that client disconnect mid-stream skipped streamText's onEnd (usage
  row for the sonnet call never written → monthly spend cap bypassable by
  aborting; partial reply + title still persisted/logged). Fixed with
  `void result.consumeStream({onError})` (verified against ai@7.0.31 dist:
  teed base stream, drain guarantees flush→onEnd→logUsage) + titling skipped
  when persist fails + `createThread` onConflictDoNothing (concurrent
  first-POST 500; cross-user collision verified safe under RLS + user_id
  predicates). Still in flight: sonnet bug-hunt over interview/resume/
  relationships routes. Session-5 facts for later sessions: (a) run local e2e
  with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` + CI
  placeholder env → 1 passed/10 skipped is the green baseline; (b) mocking the
  assistant stream = `buildUiMessageStream()` in tests/e2e/_helpers.ts;
  (c) `logUsage` is sync fire-and-forget by design at all call sites.

- **2026-07-18 (session 5, cloud, IN PROGRESS — checkpoint)** — Phase 5. Committed so
  far: (1) architecture.md embeddings drift fixed (docs now say OpenAI
  text-embedding-3-small, the actual stack; Voyage switch stays an open Jake
  decision); (2) **e2e unblocked** — playwright.config.ts got a `webServer` block
  (`pnpm build && pnpm start`, reuseExistingServer outside CI) so `pnpm test:e2e`
  is self-sufficient; CI's e2e job could never pass before (no server was ever
  started). Verified with a real run under CI's placeholder env: 1 passed,
  6 skipped. New opt-in `PLAYWRIGHT_CHROMIUM_EXECUTABLE` env var for containers
  with a pre-seeded chromium (`/opt/pw-browsers/chromium` here — the installed
  revision mismatches @playwright/test 1.59.1's expected one, so set it locally).
  Signed-out requests never hit the placeholder Supabase URL (auth-js
  short-circuits without a session cookie). In flight (subagents): LLM thread
  auto-titles (chat-title.ts + onEnd hook in /api/chat/assistant); e2e
  golden-path specs (chatbot w/ mocked AI-SDK-v7 UI-message stream via
  page.route, question-bank smoke, storageState global-setup gated on
  STREETPREP_E2E_AUTH + STREETPREP_E2E_EMAIL/PASSWORD). Known facts: authed e2e
  specs need real creds — CI would need secrets before ungating them (file to
  jakes-tasks when specs land).
  - **Deferred e2e subagent landed (same session, not yet committed):**
    `tests/e2e/global-setup.ts` added (wired via `globalSetup` in
    `playwright.config.ts`) — signs in through the real `/login` form once and
    writes `tests/e2e/.auth/user.json` (gitignored) only when
    `STREETPREP_E2E_AUTH=1` + `STREETPREP_E2E_EMAIL`/`STREETPREP_E2E_PASSWORD`
    are set; no-ops otherwise. `_helpers.ts` gained `AUTH_STORAGE_STATE_PATH`
    plus `buildUiMessageStream()`/`UI_MESSAGE_STREAM_HEADERS` (the AI SDK
    v7.0.31 wire format, verified against `node_modules/ai/dist/index.js`, not
    training data: SSE `data: <json>\n\n` lines of `UIMessageChunk`s —
    `start`→`start-step`→`text-start`→`text-delta`→`text-end`→`finish-step`→
    `finish`→literal `data: [DONE]`). New `tests/e2e/chatbot.spec.ts` (2 tests:
    send → mocked reply renders → URL gains `?thread=<uuid>`; thread rail gets
    an entry) mocks `/api/chat/assistant` via `page.route` — no
    `STREETPREP_E2E_LIVE_AI` needed. New `tests/e2e/question-bank.spec.ts`
    drives the "By topic" tab (`serveQuestionAction` is a pure DB read, no AI)
    to serve a question and prove the submit button enables on input, without
    ever calling `gradeAnswerAction` (that hits Claude). Added
    `data-testid="qbank-topic-<value>"` / `qbank-difficulty-<value>` /
    `qbank-serve-button"` to `components/learn/question-bank-studio.tsx` only
    (attribute-only; did not touch `AnswerCard`/`PracticeSession`, which
    another concurrent agent's chatbot work didn't overlap with either). Also
    wired the previously-inert `storageState` into the five *existing* authed
    specs that assumed a logged-in session but never had one
    (`profile.spec.ts`, `applications.spec.ts`, `interview.spec.ts`,
    `resume.spec.ts`, and the authed describe in `chat.spec.ts`) via
    `test.use({ storageState: AUTH_STORAGE_STATE_PATH })` scoped inside each
    gated `describe` block — `auth.spec.ts` deliberately untouched (its public
    redirect test and its self-contained signup golden path must not carry a
    pre-authed session). Verified: `pnpm typecheck` clean, `pnpm lint` 0
    errors, `pnpm exec prettier --check` clean, `pnpm test:e2e` under CI's
    placeholder env → **1 passed, 10 skipped** (was 1/6; +4 for the two new
    specs' two tests each). CI secrets needed to actually run these authed
    specs filed to `jakes-tasks.md`. Left uncommitted per the calling
    session's instructions — next session should `git status`/review and
    commit if it looks good.

- **2026-07-17 (session 4, cloud)** — **UNIT 9 COMPLETE — all five issues shipped**
  (01 streaming+persistence, 02 tool use, 05 thread rail, 03 web search, 04 firm
  prep; ~10 commits). Suite went 362 → **390 passing**; every issue verified with
  typecheck/lint/full suite/build before its commit. Facts for the next session:
  (a) the AI SDK is **v7.0.31** (PRD said v6 — stale; verify APIs against installed
  `.d.ts`, not training data; persistence callback is `onEnd`, usage has
  `inputTokenDetails`); (b) migration numbering: **0010 is taken**, next is 0011;
  (c) `/api/chat/assistant` reloads history server-side — client sends only
  `{threadId, message}`; thread ids are client-generated uuids; a `seq` identity
  column orders messages; (d) `StoredPartSchema` in `lib/db/queries/chat.ts` governs
  what persists (text + settled tool parts + source-url; extend it for new part
  types — jsonb needs no migration); (e) `sdkUsageToTokenUsage` + `logUsage
  surchargeUsd` in `lib/ai/usage.ts` are the AI-SDK usage adapters (web search =
  $0.01/call); (f) tools live in `buildAssistantTools(userId)` (closure-injected
  userId; provider web_search added in the route); search_chat_logs is hybrid
  semantic+keyword with an optional firm scope; (g) **0010 must be applied by Jake**
  (page 500s in prod until then) and prod needs seed.sql's firms rows (both in
  jakes-tasks). **Deferred (candidates for next sessions)**: e2e specs incl. the
  "why JPM" golden path (`tests/e2e/chatbot.spec.ts`, mocked LLM); `firm_data`
  refresh pipeline (own unit); LLM auto-titling of threads; deleting
  `lib/streaming/stream-error` is NOT possible yet (guide chat still uses it).
  **Session tail**: Unit 8 diffed (`.scratch/unit-8-question-bank/
  SCOPING-2026-07-17.md`) — issues 01–05 were already shipped by Unit 11; the 50-test
  debt backfill is done (suite **441 passing**); issue 06 + chat-onboarding are
  triage-gated on Jake (jakes-tasks). **Next lanes for session 5**: (1) e2e coverage
  (fresh context recommended: playwright specs for chatbot golden path + question
  bank, mocked LLM, STREETPREP_E2E_AUTH=1); (2) any Jake go-aheads (Unit 8 #06,
  chat onboarding); (3) Unit 10 calendar sync stays BLOCKED on Google creds.

- **2026-07-16 (session 3, cloud, later)** — **Phase 4 COMPLETE + Phase 5 started**;
  ~8 more commits. Phase 4: repo-wide prettier (CI gate 1 was failing on 89 files —
  KEEP `pnpm format` before committing or CI breaks again), `.env.example` regenerated
  + git-tracked, dep patches (eslint-config-next/zod/supabase-js; majors deliberately
  skipped), robustness fixes (interview/score + extract-resume now Zod-parse LLM
  output), mid-stream-error integration test. Phase 5 slice: follow-ups loop closed
  (summary → followup rows w/ dedupe + unit-tested date normalization, widget
  mark-done, draft persisted). Suite **362 passing**. Next lanes in the Phase 5
  checklist note above.
- **2026-07-16 (session 3, cloud)** — **Phase 3 COMPLETE**; 4 commits
  (`15765e0`…`4f38996`). Closed the whole Phase 3 backlog (see checklist above). New
  facts: (a) contact CRUD lives in `lib/data/contacts.ts` (Supabase-client style, NOT
  Drizzle/withUser — deliberate, matches the domain's existing reads) with Server
  Actions in `app/(app)/tools/relationships/actions.ts` + non-AI `contactsLimiter`;
  (b) `chats.id`/`contacts.id` are text PKs — chats default `gen_random_uuid()::text`,
  contacts get `crypto.randomUUID()` app-side; (c) AI route schemas (prep-person /
  structure-chat / draft-followup) now allow empty `contactTitle` — user-created
  contacts may have none; (d) stream clients split on `STREAM_ERROR_SENTINEL` from
  `lib/streaming/stream-error` (unit-tested); any new plain-text streaming route should
  return `streamTextResponse(stream, route)` from `lib/ai/stream-response`; (e) firms
  pages read the `firms` table — **prod must have seed.sql's firms insert applied**
  (filed to jakes-tasks); (f) suite now **353 passing**. Next: Phase 4.
- **2026-07-15 (setup, local)** — Branch + work order created. Relay routine scheduled
  (first run 1:10pm ET). No code work done yet; Phase 1 starts on the first cloud run.
- **2026-07-16 (session 2, cloud, later)** — **Phase 3 mostly done**; 7 more commits
  (`847dbe9`…`c97c0ed`). Mobile nav added (Sheet drawer + top bar); gate/tour/practice
  state-machine bugs fixed; progress page rebuilt on real data (new `lib/mastery/
  activity.ts` + tests); vitest include fixed (lib colocated tests now run — suite 346);
  ~20 medium/low UX fixes. Suite: **346 passing**; build green. Remaining Phase 3
  backlog listed in the checklist above — start with the relationships real-data slice.
- **2026-07-16 (session 2, cloud)** — **Phase 2 COMPLETE**; 8 commits pushed
  (`8dc6bac`…`c6ce07b` + docs). See CHANGES.md for the full measurement story and
  baseline → after counts. Facts for later sessions: (a) the relationships/firms UI pages
  still render SEED data (`lib/data/contacts.ts` seeds, `seedFirms`) — the real Supabase
  reads in `lib/data/*` are exercised only by the chatbot tools; wiring pages to real
  data is Phase 3+ product work; (b) `lib/analytics/` is entirely unwired (PostHogProvider
  never mounted, no tracking call sites); (c) architecture.md says Voyage embeddings but
  the code uses OpenAI text-embedding-3-small — doc/code drift, untouched; (d) new
  `sp-onboarded` cookie in `lib/auth/middleware.ts` memoizes the onboarding gate — if an
  un-onboard flow is ever added, that cookie logic must change; (e) Turbopack: no bundle
  analyzer, no Sentry treeshake — don't re-litigate without new tooling.
- **2026-07-15 (session 1, cloud)** — **Phase 1 COMPLETE**; 19 commits pushed to
  `fable/prod-readiness` (`3995243`…`7bb03ff` + docs). Fixed: usage-logging lazy
  thenable (fix-first), 4 blocking lint errors, 5 pre-existing test failures (stale mocks),
  security headers, lazy Drizzle client (CI build unblocked), CI `main`→`master`,
  error-text leaks (12 routes), assistant tool-arg Zod validation, LLM tool-output Zod
  validation (structure-chat / draft-outreach / resume-critique), chat_embeddings ownership
  check, AI limiter fail-closed + tests, monthly spend cap in `requireUser` + tests,
  markdown href scheme guard, 12 unused deps removed, Sentry build plugin, `/api/*` proxy
  auth backstop, next 16.2.10 + react 19.2.7, `db:*` script guard, earnings-text prompt
  isolation. Suite: 325 passing. Docs updated (CHANGES, progress-tracker, jakes-tasks).
  Next session: Phase 2 — measure first (see Phase 2 notes above).

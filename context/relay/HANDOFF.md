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

- **2026-07-21 (session 9, cloud, checkpoint 2 — 9 commits pushed, suite 973/125)** —
  All lanes landed since checkpoint 1: **applications fixes** (`e33b2d0` — blank
  deadline no longer breaks saves; clear-vs-absent update semantics for
  url/deadline; NOT_FOUND on TOCTOU races; +PGlite integration suite),
  **a11y fixes** (`6d1e106` — shared `components/status-line.tsx` StatusLine
  wraps every AI-wait spinner; product-tour focus trap/restore; scorecard
  focus on scoring; heatmap role=img label), **mock-interview persistence**
  (`b03665f` — save path was fully built but never called; studio now saves
  best-effort after scoring + new Past Sessions list on /tools/mock-interview;
  mock_interviews already in account export), **opus adversarial review of the
  session diff** — all majors CONFIRMED CLEAN with traced evidence (qbank
  follow-up exclusion can't lock out gates: follow-ups only fire after a
  correct main answer; mastery zero-row is rollback-safe same-tx; Zod key
  presence works as the update semantics assume; e2e specs have no destructive
  fall-through even with real creds), 3 low findings all fixed (`151edbe` —
  multipart slack in content-length pre-check, real calendar-date validation
  for deadline (`new Date("2026-02-31")` rolls over, doesn't fail!),
  answer-card live region narrowed). Full gates verified by the last agent run:
  typecheck ✅ lint 0 err (2 pre-existing warnings) ✅ suite 973/125 ✅ build ✅.
  No new Jake items this session. **Next-lane menu (session 10)**: (a) Jake-gated
  go-aheads if answered (Unit 8 #06, chat onboarding, firm_data, transcription
  model, e2e CI creds, NEXT_PUBLIC_SITE_URL/og:image, legal approval); (b)
  perpetual: bug-hunt the areas session 9 didn't re-sweep (chatbot/unit-9
  internals, auth flows, middleware), model-routing/batch-API cost items still
  eval-gated, another brainstorm lane (e.g. observability/error triage or
  activation polish); (c) watch: Jake applying 0009–0013.

- **2026-07-21 (session 9, cloud, checkpoint 1 — 3 commits pushed)** — Phase 5,
  three-lane fan-out (e2e specs / fresh-eyes bug hunt / a11y sweep). Landed:
  **e2e specs for settings/export/feedback** (`59c6625`, 5 gated tests, baseline
  now 1 passed / 15 skipped; deletion spec never clicks the enabled destructive
  button; feedback submit is a Server Action posting to the page URL — drive UI
  up to but never past the action); **content-length pre-checks** (`f4203ad`,
  shared `lib/security/content-length.ts` — resume/extract, interview/transcribe,
  whisper/transcribe all buffered full bodies before size checks; critique cap
  unified to exported 20k constant); **qbank gate-scoring + mastery race**
  (`a6eac02` — listSittingScores now excludes follow-up attempts (they share the
  parent's question_id; a later harder-rubric follow-up score could flip a gate
  pass→fail) and topic mastery uses getTopicMasteryForUpdate (insert-or-ignore
  zero row + FOR UPDATE; works on PGlite + drizzle 0.45.2)). Bug-hunt digest
  REMAINING (not yet fixed): **mock interviews never persisted** — the complete
  `/api/interview/save` route + saveMockInterview + tests exist but
  mock-studio.tsx never calls it (and getMockInterviews has no caller/history
  view); applications blank-deadline crash + url-clear-on-update no-op +
  NOT_FOUND error shape (fixer in flight); serveQuestionAction has no limiter
  (intentional per test comment — left); resume caps/e2e selector fixed above.
  A11y sweep digest: 4 high (chat/mock-studio/answer-card missing live regions,
  product-tour has zero focus management) + systemic spinner-no-status pattern
  (fixer in flight, shared status-line component). In flight at checkpoint:
  a11y fixer, applications fixer; queued: mock-studio save wiring (blocked on
  a11y agent releasing mock-studio.tsx), final gates + prettier repo-wide.
  GOTCHA: concurrent vitest runs contend — PGlite cold-start beforeEach can
  time out (>15s) under load; re-run the file alone before believing a failure.

- **2026-07-20 (session 8, cloud, FINAL — 17 commits, all pushed, suite 932/122)** —
  Session tail after the notification: migration **0013** authored (`b766374`,
  chat_embeddings ivfflat → HNSW while near-empty; match_chat_embeddings loses
  the moot probes GUC; Jake applies — filed; NEXT FREE MIGRATION NUMBER: 0014).
  Session complete. Final round after checkpoint 3: UX sweep of the new
  surfaces → 2 fixes (`6f58f57`): settings page back-to-profile link; feedback
  button moved bottom-right → bottom-LEFT (sonner toasts render bottom-right at
  z-index ~1e9 directly over it, and the chatbot composer's send button overlaps
  the same corner — bottom-left verified unclaimed app-wide). Clean on
  everything else it audited (dialog a11y, export-button 401 behavior, legal-page
  chrome consistency, 404; NOTE: the product is deliberately LIGHT-MODE-ONLY
  per ui-context.md §3 — don't "fix" dark theme). Final gates: typecheck ✅
  lint 0 err (2 pre-existing warnings) ✅ suite 932/122 ✅ build exit 0 ✅
  repo-wide prettier ✅. **Session-8 shipped in total**: account deletion,
  data export (+dedicated 6/hour limiter), privacy/ToS/404 (+honesty fixes
  from review), feedback widget + migration 0012, /api/health, injection
  framing, dead-schema deletion, +81 tests net, 2 issues filed AND closed
  same-session, 5 new Jake tasks. **Next-lane menu (session 9)**: (a) Jake-gated
  go-aheads if answered (Unit 8 #06, chat onboarding, firm_data, transcription
  model, e2e CI creds, NEXT_PUBLIC_SITE_URL/og:image, legal-language approval);
  (b) perpetual: another bug-hunt sweep with fresh eyes (the clean-area map in
  CHANGES session-5 is aging), e2e specs for the new settings/export/feedback
  flows (mocked, free), HNSW migration for chat_embeddings (brainstorm
  2026-07-19), model routing for grading / batch embeddings (cost brainstorm);
  (c) watch: whether Jake applied 0010–0012 (prod 500s on /tools/chatbot until
  0010; feedback errors until 0012).

- **2026-07-20 (session 8, cloud, checkpoint 3 — 13 commits pushed, suite 932/122)** —
  Opus adversarial review of the whole session diff came back with 2 CONFIRMED
  findings, both fixed: **privacy-page claims contradicted the code** (said no
  export tool exists while this session shipped one; claimed 30-day recording
  deletion / signed-URL serving / per-user file storage — no storage code
  exists anywhere) → `28c3ee6` + `7b8e47a`; export route got a dedicated
  6/hour `accountExportLimiter` stacked on the cheap tier → `c09f4ea`.
  Review confirmed CLEAN with traced evidence: export cross-user isolation
  (withUser RLS + explicit eq filters, no CORS), deletion CSRF/order/races,
  middleware exact-match allowlist, feedback RLS/XSS. Accepted: /api/health
  unauthenticated+unthrottled by design. CORRECTION to checkpoint 2's
  follow-up list: `lib/curriculum/progress.ts` + `cycle.ts` ARE fully tested
  (session 6's c1869ad, 28 tests) — a coverage agent misreported the gap; do
  NOT re-add. IN FLIGHT: sonnet UX sweep over the new surfaces (settings page,
  feedback widget overlap/z-index, legal pages, 404). Checkpoint-2 log follows.

- **2026-07-20 (session 8, cloud, checkpoint 2 — 9 commits pushed, suite 931/122)** —
  Wave 2 landed: **data export** (`f214517`, GET /api/account/export, 18 tables,
  cheap tier, embeddings excluded — issue 01 closed), **injection framing**
  (`79676d8`, ASSISTANT_SYSTEM frames tool/web_search results as untrusted data —
  issue 02 closed), **dead schema deleted** (`4c48ad0` — resumes.ts +
  interview-sessions.ts described tables with NO migration and NO call sites),
  **page/reader coverage** (`c2c8cc3`, +37 tests: 8 page files w/ real branching
  - markdown/reading-lens extensions; thin delegation pages skipped by design).
    Inline review of the deletion action came back clean. IN FLIGHT at checkpoint:
    an opus adversarial review of the entire session diff (52898c3..HEAD), focused
    on export-route data exposure, deletion races/CSRF, health-route allowlist
    bypass, feedback RLS, legal-page claim accuracy. Known follow-up gaps for
    session 9: `lib/curriculum/progress.ts` + `cycle.ts` pure logic has no
    dedicated unit tests; export could use a dedicated tight limiter (2/hour)
    instead of cheap tier. Checkpoint-1 log follows.

- **2026-07-20 (session 8, cloud, checkpoint 1 — 5 commits, suite 888/113)** —
  Phase 5, launch-compliance lane. Shipped the brainstorm's top-4 AFK-safe builds
  via 3 parallel agents (opus: deletion; sonnet: legal pages, feedback+health):
  (1) **account deletion** at `/profile/settings` (`c3bc481`) — confirm-twice
  type-DELETE, storage cleanup before `auth.admin.deleteUser`, cascade audit
  0000–0012 clean (no explicit row deletes needed), `sp-onboarded` cleared,
  `accountDeletionLimiter` fail-open. FINDING: **no Storage upload code exists
  anywhere** (`.storage.from(` zero call sites) — buckets likely unprovisioned,
  filed to jakes-tasks; deletion tolerates missing buckets. PostHog person-delete
  deferred (analytics unwired, TODO in action). (2) **privacy + terms + 404**
  (`8daf791`) — subprocessors verified from code; **Groq is doc drift** (both
  transcribe routes call OpenAI whisper-1) — architecture.md fixed; governing law
  is a visible Jake placeholder. (3) **feedback widget + GET /api/health**
  (`d4819b6`) — migration **0012_feedback.sql** (0013 is next free), owner RLS,
  `feedbackLimiter`; health probe allowlisted via `PUBLIC_API_ROUTES` in
  middleware. Issues filed: `.scratch/launch-readiness/issues/01-data-export.md`
  - `02-prompt-injection-review.md` (both ready-for-agent). New Jake items: apply
    0012, legal review, storage buckets, `SUPABASE_SERVICE_ROLE_KEY` in Vercel,
    uptime monitor. Gates at checkpoint: typecheck ✅ lint 0 err ✅ 888/113 ✅
    build 0 ✅ prettier ✅. **Next lanes this session (in order): data-export issue
    01 (reuses deletion enumeration, settings page now exists), prompt-injection
    issue 02 (small), then page-level tests for app/(app) pages / guide-reader
    dom tests (untested surface per session-7 menu).**

- **2026-07-19 (session 7, cloud, FINAL — 16 commits, all pushed, suite 855/105)** —
  Round 3: an opus adversarial review of the ENTIRE session diff (5a26680..HEAD)
  came back clean on all 7 areas — migration idempotency, logUsage call-site
  enumeration, robots/sitemap route sets, initialMode lazy init, regenerate
  restore races, reading-lens listener cleanup, deep-link encoding — no fixes
  needed (one accepted tradeoff: keyboard selection settle at 150ms pulls focus).
  Launch-readiness brainstorm committed
  (`context/brainstorms/2026-07-19-launch-readiness.md`): TOP AFK-SAFE BUILDS for
  session 8+: (1) **self-serve account deletion** — architecture.md line 218
  already promises it, DB cascades already exist in 0000_baseline, needs admin
  delete call + Storage cleanup + UI (M, unblocked); (2) **feedback widget** (S);
  (3) **privacy policy + ToS pages drafted** (S/M, Jake approves language).
  Jake-gated launch checks filed to jakes-tasks (Supabase plan/backups, publish
  Google OAuth consent screen — Testing mode caps at 100 sign-ins, Vercel spend,
  password-reset live test). Also noted in brainstorm: ivfflat→HNSW candidate for
  chat_embeddings at launch scale (not urgent).
  Round 2 (after the 803/97 checkpoint below): component coverage FINISHED — every
  non-shadcn component now has dom tests (27 files / 148 dom tests; mock-studio full
  mocked record→transcribe→score flow, resume-coach, firm-prep restore-on-failure,
  chat-panel, product-tour via getBoundingClientRect stub, auth components);
  reading-lens keyboard a11y SHIPPED (ux-polish/01 closed — debounced
  selectionchange + managed focus + Escape); mobile sweep → 8 findings all fixed
  (chapter-row stacking, thread-rail touch-visible options, 36px touch targets,
  nudge-row stacking, resume sticky gated to lg, rubric grid collapse, heatmap
  7-col wrap). Final gates: typecheck ✅ lint 0 err ✅ suite 855/105 ✅ build 0 ✅
  prettier ✅. Round 1 summary follows.
  Phase 5. Orchestrated as 8 parallel subagents (3 test batches, UX sweep, 2 UX
  fixers, SEO, opus migration). (1) **Session-6 flake SOLVED**: chat.test.ts PGlite
  cold-WASM instantiation ~6s vs 5s vitest default; node project now has
  testTimeout+hookTimeout 15s — stop treating first-run failures as mysterious.
  (2) **Component dom coverage 2 → 19 files (+81 tests)**; happy-dom gotchas: Radix
  Tabs switch on mousedown, DropdownMenu opens on pointerdown, fake
  IntersectionObserver needed, clipboard via defineProperty. (3) **UX sweep: 10
  findings, 9 fixed** (see CHANGES session-7), 1 filed as
  `.scratch/ux-polish/issues/01-reading-lens-keyboard-access.md` (ready-for-agent).
  (4) **SEO baseline**: robots.ts/sitemap.ts/OG metadata via new `lib/site.ts`;
  Jake must set NEXT_PUBLIC_SITE_URL in Vercel (filed); no og:image asset exists.
  (5) **Deferred Low #16 CLOSED**: migration 0011 (ai_usage.user_id NOT NULL,
  orphan NULL rows deleted — Jake applies, filed); logUsage skips+warns without
  userId; pglite test schema mirrors NOT NULL. **Next-lane menu (session 8)**:
  (a) Jake-gated go-aheads if answered (Unit 8 #06, chat onboarding, firm_data,
  transcription model, e2e CI creds, NEXT_PUBLIC_SITE_URL/og:image); (b)
  `.scratch/ux-polish/issues/01` reading-lens keyboard a11y (ready-for-agent);
  (c) web_search_20260209 upgrade still money-gated; (d) brainstorm items: model
  routing for grading, batch API embeddings; (e) perpetual: app/(app) page-level
  tests are still untested surface (pages vs components), guide/reader area has no
  dom tests, another fresh-eyes sweep on mobile layouts.

- **2026-07-18 (session 6, cloud, FINAL — ~18 commits, all pushed, suite 720/80)** —
  Phase 5. Full-session summary (details in the two checkpoints below): (1) **auth/
  rate-limit consolidation COMPLETE** — one shared primitive `lib/ratelimit/core.ts`
  (`buildLimiter`), both surfaces are thin adapters; key prefixes/tiers byte-preserved;
  NEW store-error policy: Redis failure now denies AI tiers and allows cheap/public
  (previously it 500'd every route). (2) **Spend-cap bypass closed** —
  `assertAiActionAllowed` gates `gradeAnswerAction` (the only AI-calling Server
  Action). (3) **Opus pricing bug** — PRICING had $15/$75 for claude-opus-4-7, real
  price $5/$25 (verified live): interview-score + resume-critique were billed 3x
  in ai_usage, tripping the $20 cap ~3x early. (4) **Prompt caching enabled** on
  chat/assistant (SystemModelMessage + anthropic cacheControl; tools+system prefix
  ~1.1–1.5k tokens > 1024 floor; usage mapping already captured cache tokens).
  (5) **fieldErrors fix** — actionErrorFromAppError now propagates
  ValidationError.fieldErrors. (6) **Coverage push +199 tests / +15 files**
  (521→720): pure lib modules, real lib/ai/grading, relationships + auth actions,
  stream-response bridge, dashboard tour action, analytics no-op paths.
  (7) Prettier CI-gate fix (7 session-5 files weren't format-clean). All gates
  verified at end: typecheck ✅ lint 0 err ✅ suite 720/80 ✅ build exit 0 ✅
  e2e 1 passed/10 skipped (green baseline) ✅ repo-wide prettier ✅. **Flake note:**
  1 test failed ONCE on the first run after fresh pnpm install, never in 6
  subsequent runs (identity unknown — output wasn't captured); treat first-run
  failures after install as suspect warm-up, capture the log before diagnosing.
  **Next-lane menu (session 7)**: (a) Jake-gated go-aheads if answered (Unit 8 #06,
  chat onboarding, firm_data, transcription-model swap, e2e CI creds);
  (b) web_search_20260209 upgrade — SDK 4.0.16 exposes it but sonnet-4-6 model
  support unverified and a live test costs money (route comment documents the pin);
  (c) more brainstorm items (`2026-07-18-ai-cost-optimization.md`): model routing
  for grading, batch API for embeddings backfills; (d) perpetual: UX polish sweep
  with fresh eyes, component (dom-project) test coverage is still thin.

- **2026-07-18 (session 6, cloud, superseded — checkpoint 2)** — Since checkpoint 1:
  **consolidation COMPLETE** (`5de1d7d` slice 2 — checkRateLimit on the shared core,
  prefixes/tiers byte-preserved, NEW store-error policy deny-AI/allow-cheap;
  `514e877` slice 3 — headers now describe one core + two adapters); **R4 spend-cap
  gap CLOSED** (`03caf58` — `assertAiActionAllowed(userId)` in lib/ai/usage.ts gates
  gradeAnswerAction, the ONLY AI-calling Server Action [verified by enumeration];
  same RateLimitedError/message as routes; fail-open on store fault, closed on
  definitive over-cap — mirrors require-user); **opus pricing bug FIXED**
  (`867df1f` — PRICING had Opus-4.1-era \$15/\$75 for claude-opus-4-7; real price
  \$5/\$25 verified against Anthropic's live pricing page → interview/score +
  resume/critique were logged at 3x cost, tripping the \$20 cap ~3x early);
  **style commit** `7ef469f` (7 session-5 files weren't prettier-clean — CI's
  format gate would fail at 9751967; watch for this: run prettier --check
  repo-wide before ending a session); **cost brainstorm** committed
  (`context/brainstorms/2026-07-18-ai-cost-optimization.md`, `1ae6e8d`) — top
  items: chat/assistant caches NOTHING (bare-string system; in flight this
  session), whisper→gpt-4o-mini-transcribe would halve transcription cost
  (quality-gate first), web_search_20260209 dynamic-filter variant cuts
  compounding search-result token re-billing. Suite at checkpoint 2:
  **626 passing / 74 files**. In flight: prompt-caching on chat/assistant
  (opus agent). Remaining queue: flake hunt (run LAST, quiet machine).

- **2026-07-18 (session 6, cloud, IN PROGRESS — checkpoint 1)** — Phase 5. Lane picked:
  auth/rate-limit consolidation (design-first, opus design + opus implementation) +
  parallel coverage push. Landed so far: **fieldErrors fix** (`8bec85b` — the shared
  `actionErrorFromAppError` translator dropped `ValidationError.fieldErrors`; forms lost
  inline messages on any thrown ValidationError); **~120 new unit tests** (`c1869ad`
  pure modules: audio/analyze, curriculum cycle/progress/chapters, validation/parse,
  auth action-result/server, logging/request-context; `43ccc64` real-module lib/ai/
  grading tests — was only ever vi.mock'd away; `c28ee8d` reconciliation — see gotcha
  below); consolidation **slice 1** (`1b011de`, shared core extracted, limiters.ts
  repointed). In flight: slices 2–3 (rate-limit.ts adapter + store-error policy:
  deny AI tiers / allow cheap+public — legacy had NO policy, Redis outage = 500 on
  every route; then dead-code deletion). Queued next: R4 spend-cap gap (AI Server
  Actions like gradeAnswerAction never call assertUnderQuota — only Route Handlers
  enforce the monthly cap); unidentified flaky test (1 failure on fresh-clone run 1,
  runs 2–3 fully green 521/521 — not yet hunted). **GOTCHA for future sessions:
  worktree-isolated subagents get worktrees cut from MASTER, not from
  fable/prod-readiness** — two test-writing agents authored against 99-commits-stale
  code; one "missing file" was actually branch-only, and its substitute duplicated
  existing branch tests (dropped in `c28ee8d`, its one novel case ported). If you
  isolate agents in worktrees, tell them to `git checkout fable/prod-readiness` first,
  or reconcile after like this session did.

- **2026-07-18 (session 5, cloud, FINAL — 19 commits, all pushed, suite 521)** — Phase 5.
  Second half of the session ran three adversarial review sweeps + fixes on top of
  checkpoint 2's work: (1) **whisper spend blind spot** (CONFIRMED, also affects
  master/prod today): neither transcribe route ever logged ai_usage — now one row
  per call via surchargeUsd (duration/60 × $0.006); the token-priced whisper-1
  PRICING entry was decorative and is deleted. (2) **relationships consistency**:
  structure-chat/draft-followup wrap the Anthropic call → 502 like siblings;
  resume-coach skips unknown weakness flags; dead 'markets' mode removed from
  INTERVIEW_MODES (DB CHECK deliberately untouched). (3) **gate-scoring exploit
  closed**: finishSittingAction now enforces 6h window + min distinct-question
  count (canonical counts live in lib/curriculum/chapters.ts; clamped to pool for
  thin sections); residual: served-question set not pinned (needs server-side
  sittings — only build if Jake cares). (4) **paper-LBO NaN** (~1/24 of runs)
  fixed, full-domain regression sweep added. (5) **new-thread flicker** fixed via
  ChatSession stable mount key (unit-9 issue 06 filed AND closed this session).
  **Clean-area map** (don't re-hunt without new evidence): see CHANGES.md session-5
  entries — chatbot, interview/resume/relationships, learn/mastery/dashboard/
  onboarding/applications/limiters/RLS all swept. **Next-lane menu for session 6**:
  (a) Jake-gated go-aheads if answered (Unit 8 #06, chat onboarding, firm_data
  brainstorm questions, PostHog); (b) auth/rate-limit stack consolidation
  (lib/security/_ vs lib/ratelimit/_ — big, design-first, needs a fresh context);
  (c) served-question-set pinning if gate integrity matters more than effort;
  (d) e2e: get authed specs actually running once Jake supplies creds (then CI
  secrets item); (e) perpetual: more coverage, UX polish, brainstorms. Suite
  baseline for session 6: **521 passing / 65 files** (session tail added 100%
  coverage on lib/auth/middleware.ts, lib/db/queries/ai-usage.ts, and the
  contact mutations, + fixed SAMPLE_GUIDE_SLUG to a real guide); e2e 1
  passed/10 skipped.

- **2026-07-18 (session 5, cloud, checkpoint 2 — superseded by FINAL above)** — Phase 5.
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
  assistant stream = `buildUiMessageStream()` in tests/e2e/\_helpers.ts;
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
    wired the previously-inert `storageState` into the five _existing_ authed
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
  - git-tracked, dep patches (eslint-config-next/zod/supabase-js; majors deliberately
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

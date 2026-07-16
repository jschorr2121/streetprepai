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
- [ ] Phase 4 — Production-readiness checklist (note: CI push trigger fixed; `pnpm build`
      now works without DATABASE_URL, so the CI build step is unblocked; `.env.example`
      regeneration still open)
- [ ] Phase 5 — Perpetual improvement

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

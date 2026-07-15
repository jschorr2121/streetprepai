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
- [ ] Phase 2 — Performance (the long loading times) — **START HERE.** Measure first:
  bundle analyzer isn't installed (`@next/bundle-analyzer` was never added); Turbopack
  build output has no size table, so add the analyzer or use `--profile`. Check DB
  indexes against `web/supabase/migrations/` + hot queries in `lib/db/queries/` and
  `lib/data/`; look at the pgvector ivfflat index; audit prompt-caching coverage
  (several routes already use `cache_control: ephemeral`); check `use cache`/ISR
  opportunities on firms/sectors/learn metadata. Record baseline → after in CHANGES.md.
- [ ] Phase 3 — UX fixes & bugs
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

- **2026-07-15 (setup, local)** — Branch + work order created. Relay routine scheduled
  (first run 1:10pm ET). No code work done yet; Phase 1 starts on the first cloud run.
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

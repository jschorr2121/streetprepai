# StreetPrepAI relay — baton / handoff

> You are one session in a standing relay making StreetPrepAI production-ready. Read
> `context/RELAY-QUEUE.md` (the work order) and follow its universal rules. Work on
> branch `fable/prod-readiness` — NEVER master. Don't stop at a phase boundary; keep
> going to the next item while budget remains. Update this file every session.

## Phase checklist

- [~] Phase 1 — Correctness & security hardening — **mostly done** (session 1). Fix-first
  usage.ts bug ✅, security headers ✅, error-leak sweep ✅, LLM tool arg+output Zod ✅,
  service-role ownership check ✅, AI limiters fail-closed ✅, spend cap wired ✅, markdown
  href guard ✅, unused deps ✅, Sentry plugin ✅. Remaining (pick up here):
  - [ ] `/api/*` auth backstop in `web/proxy.ts` (its matcher currently excludes `api/`) — finding #1
  - [ ] Next 16.2.6 + react/react-dom 19.2.6 security patch bumps, one at a time — findings #6/#7
  - [ ] Guard `db:*` package scripts against the live DB — finding #9
  - [ ] Low-sev: spoofable XFF IP key (#11), forged `assistant` turns allowed by chat schemas (#13),
        `firm/prep` prompt text not `wrapUserText`-isolated (#14), `ai_usage.user_id` nullable (#16)
- [ ] Phase 2 — Performance (the long loading times)
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
- **2026-07-15 (session 1, cloud)** — Phase 1 nearly complete; 12 commits pushed to
  `fable/prod-readiness` (`3995243`…`ab4e222` + docs commit). Fixed: usage-logging lazy
  thenable (fix-first), 4 blocking lint errors, 5 pre-existing test failures (stale mocks),
  security headers, lazy Drizzle client (CI build unblocked), CI `main`→`master`,
  error-text leaks (12 routes), assistant tool-arg Zod validation, LLM tool-output Zod
  validation (structure-chat / draft-outreach / resume-critique), chat_embeddings ownership
  check, AI limiter fail-closed + tests, monthly spend cap in `requireUser` + tests,
  markdown href scheme guard, 12 unused deps removed, Sentry build plugin. Docs updated
  (CHANGES, progress-tracker, jakes-tasks). Next: remaining Phase 1 checklist above, then
  Phase 2 (measure first).

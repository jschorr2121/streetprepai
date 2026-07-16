# Relay queue — standing work order for scheduled Fable sessions (StreetPrepAI / web)

> A cloud routine ("StreetPrep relay", model Fable) reads THIS file each run and works
> the **topmost phase not marked DONE**. It works on branch **`fable/prod-readiness`**
> (NEVER `master` — pushing to master auto-deploys to production; Jake reviews and merges
> this branch himself). Reprioritize by editing this file. Ratified by Jake 2026-07-15:
> "make it production-ready — performance, security, overall readiness (UX fixes, bugs) —
> and make the code improvements you find."

## Universal rules (every session)

1. Setup: `git fetch origin && (git checkout fable/prod-readiness || git checkout -b fable/prod-readiness origin/master) && git pull --rebase origin fable/prod-readiness 2>/dev/null; git rebase origin/master`. Work from `web/` (the app). Package manager is **pnpm**; `pnpm install` first.
2. Read `web/AGENTS.md` + `web/CLAUDE.md` + `context/architecture.md` + `context/code-standards.md` and **obey every invariant** (server-side AI keys only; RLS scoped to `auth.uid()`; every LLM call writes one `llm_usage` row; rate-limit every AI route/action, fail-closed; no `JSON.parse` of model text — validate with Zod; no `any`, no `as` on internal data; no empty `catch`). The codebase is mid-migration (two parallel auth/rate-limit impls: `lib/security/*` for legacy `app/api/**` routes vs `lib/ratelimit/*` + Server Actions) — **check which pattern a file actually uses before changing it.**
3. **Don't stop at a phase boundary.** When a phase is done, mark it DONE here and immediately continue to the next phase/item. Keep working slice by slice while budget remains — one session should carry through as many items as it can.
4. **Verify before every commit** (from `web/`): `pnpm typecheck`, `pnpm lint`, `pnpm test` (vitest run — SAFE), and `pnpm build` for anything non-trivial. Never mark work done on failing checks — report failures honestly in the commit and session log. Commit in small logical commits, conventional style, and **push to `fable/prod-readiness`** every session.
5. **Document everything**: decisions → `context/CHANGES.md`; state/what-you-did/what's-next → `context/progress-tracker.md`; anything only Jake can do (dashboard toggles, secrets, third-party accounts, applying migrations, merging to prod) → `context/jakes-tasks.md`. Update the baton `context/relay/HANDOFF.md` (phase checklist + session log) every session.
6. **Hard don'ts** (breaking these is worse than doing nothing):
   - NEVER push to `master`. Only `fable/prod-readiness`.
   - NEVER run `pnpm db:push`, `pnpm db:studio`, or `pnpm db:migrate` against the live DB. Author migration SQL as files only (idempotent), and file "apply this migration" to `context/jakes-tasks.md`.
   - NEVER run `pnpm test:watch` (hangs) or `pnpm test:e2e:live` (spends real money on Anthropic/OpenAI/Groq).
   - NEVER touch or print `.env*` / secrets.
   - NEVER commit or quote `.scratch/code-review-2026-07/findings.md` — it is gitignored and details live security issues in a PUBLIC repo. Read it for guidance; keep every specific vuln detail out of commit messages, the PR, and any tracked file. Describe security fixes generically in public artifacts.
   - Skip human-in-the-loop items (product/pricing/consent/taste, live external side effects, missing credentials, third-party account setup) — file them to `context/jakes-tasks.md` and move on.

## Phase 1 — Correctness & security hardening — **DONE (2026-07-15, session 1)**

> All items below are done except three consciously deferred Lows (see
> `context/relay/HANDOFF.md`): #13 client-supplied assistant turns (inherent to the
> stateless chat API design), #11 spoofable XFF (platform-managed on Vercel),
> #16 `ai_usage.user_id` NOT NULL (needs a live-data-aware migration; author it
> only with a backfill plan). Details in `context/CHANGES.md`.

Start with the designated **fix-first** item in `todo.md`: the AI usage-logging bug in
`web/lib/ai/usage.ts` (the insert is a lazy thenable that never fires, so cost tracking
silently no-ops). Then work the AFK-safe security-hardening items from the local review
(`.scratch/code-review-2026-07/findings.md`) and `security-review-2026-06-01.md`, e.g.:
ownership checks on service-role writes, Zod-validating LLM tool output before returning
it, not leaking raw server error text to clients, adding security response headers
(CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy),
removing unused heavy deps, and wiring Sentry's build plugin. One fix per commit, each
verified. File anything needing a dashboard/secret to `jakes-tasks.md`.

## Phase 2 — Performance — **DONE (2026-07-16, session 2)**

> Measured + fixed: withUser 8→3 statements/txn, getUser deduped (React cache),
> proxy onboarding read memoized (cookie), page reads pipelined (dashboard ~17→~7
> RTs/navigation), migration 0009 authored (covering indexes + ivfflat probes —
> Jake applies), loading skeletons on all DB-backed routes, dead lib/cache removed.
> Prompt-caching invariant already satisfied. Bundle measured (Sentry/zod dominate);
> no safe Turbopack-compatible cut — documented in CHANGES.md. Baseline → after
> numbers in `context/CHANGES.md`.

## Phase 3 — UX fixes & bugs

Go screen by screen (use Playwright `pnpm test:e2e` — LIVE_AI specs self-skip — or careful
code review if the cloud box can't run browsers): loading/empty/error states, mobile
layout, keyboard/focus, visual hierarchy, broken or confusing flows, and any real bugs.
Fix them in code, verified. Compare against what strong consumer apps do.

## Phase 4 — Production-readiness checklist

Regenerate `web/.env.example` from vars actually read in code; get CI green
(`format:check`→`lint`→`typecheck`→`test:unit`→`test:int`→`build`); apply safe, tested
dependency upgrades (the flagged Next/React patch releases) one at a time; tighten
robustness (input validation at trust boundaries, no swallowed errors). File the
"re-enable Supabase Confirm email before launch" dashboard toggle to `jakes-tasks.md`
if not already there.

## Phase 5 — Perpetual improvement (never idle)

When 1–4 are DONE, keep going — each session picks the highest-value lane and leaves
artifacts: raise test coverage on real behavior; hunt and fix bugs; UX/perf polish;
work AFK-safe items from `todo.md` and the issue tracker (`.scratch/<feature>/issues/`
— Units 8 question-bank, 9 chatbot rebuild, 10 calendar sync; only
`.scratch/code-review-2026-07/` stays gitignored, the unit PRDs/issues are committed and
readable from a cold clone as of 2026-07-16, see CHANGES.md); **before implementing a
unit issue, diff it against current `web/app` + `web/supabase/migrations` — migrations
0006-0008 don't match the units' planned numbering, so some of this may already be
partially built**; and brainstorm production/launch/feature improvements into
`context/brainstorms/<date>-<topic>.md`, promoting the best to issues. No terminal
state — Jake disables the routine when done.

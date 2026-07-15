# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

**Specs complete. Implementation phase 1 — in-place migration of `/web` toward spec — in progress.**

The six context files (`project-overview.md`, `architecture.md`, `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`, this file) are all drafted and locked. The current `/web` prototype is ~50–60% aligned with spec already — strategy is to migrate incrementally via tracer-bullet vertical slices, not rebuild from scratch.

Foundation units landed so far: **Unit 1 (cleanup), Unit 2 (dependency parity), Unit 3 (Drizzle wrap), Unit 4 (auth UI + middleware), Unit 5 (IA refactor), Unit 6 (Server Action pattern proof)**. All foundation units are complete.

## Current Goal

Feature work. Next up: **Unit 7 (Application Tracker)** — first net-new feature on the new architecture.

## Completed

### Prod-readiness relay — session 1 (2026-07-15, cloud, branch `fable/prod-readiness`)

Phase 1 (correctness & security hardening) of `context/RELAY-QUEUE.md` — most items done, all
pushed to `fable/prod-readiness` (12 commits), every commit gated on typecheck + lint + full
vitest (+ `pnpm build`). Highlights: the fix-first `lib/ai/usage.ts` lazy-thenable bug (cost
tracking never wrote rows) is fixed with a regression test; security response headers
(CSP/HSTS/XFO/nosniff/Referrer-Policy/Permissions-Policy) added; raw server error text no
longer leaks to clients (12 routes, new `lib/security/client-error.ts`); LLM tool *arguments*
and *outputs* are Zod-validated (chat/general tools, structure-chat, draft-outreach,
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

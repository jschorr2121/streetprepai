# Spec-Driven Development — Running Changes Doc

A live log of decisions and changes that emerge as we fill in the `templates/context/` files. Anything here that diverges from what's currently in the codebase is a deliberate change to make.

---

## Decisions made (vs. current codebase)

- **Project name:** Street Prep AI (unchanged).
- **Target user:** US undergrads targeting IB Summer Analyst roles. Finance-vertical expansion deferred to "much later" — do not bake other verticals into the spec.
- **Information architecture shift:** the product is a **structured learning flow (course-like: chapters → readings → interactive tutorials → graded practice)** with **tools layered on top**, not a flat 12-pillar feature menu. The current codebase has the 12 pillars as side-by-side surfaces; the spec should reframe them as: (a) the learning flow spine, and (b) tools available at any time.
- **Learning flow ordering** (per user): how to apply → which firms do what → sectors → guides → technicals → behavioral.
- **Authenticated-only:** Goal #1 explicitly requires authenticated user access. The current prototype has stubbed auth — this is a confirmed change for the spec target.
- **Resume-driven profile:** users fill out their profile by uploading their resume; profile data feeds the chatbot, story framer, and prep sheets.
- **Chatbot is tool-using:** chatbot can pull from profile, networking history, web, IB knowledge, and firm data — not just guide-scoped Q&A.
- **HireVue practice** is a first-class mock-interview mode (currently the codebase mentions only voice mock; HireVue framing is explicit).
- **Networking discovery:** in addition to tracking past contacts, the spec includes discovering *new* people to network with (new feature, not in current codebase).
- **Learning flow teaches the tools:** chapters in the learning flow don't just teach concepts — they teach users *how to use the product's own tools* in context. E.g., the Networking chapter walks the user through the Relationship Manager; the Behavioral chapter walks them through the Story Framer. Pedagogy and practice are integrated.
- **Cut from the spec** (currently in codebase as stubs or partially built):
  - Job hub (filterable IB postings)
  - Community forum + interview report exchange
  - Mentor marketplace + office hours / live AMAs
  - Spaced-repetition flashcards
- **Goals confirmed/added:**
  - Discover new people to network with — promoted to a top-level goal.
  - Sector deep-dives (TMT, healthcare, FIG, etc.) — top-level goal.
  - Firm-specific pages (earnings, deals, intel) — top-level goal.
  - "AI prep at the moment of need" — folded into the chatbot goal, not a separate goal. The chatbot is the surface for synthesizing personalized prep.

## Open questions

- Do guides need **interactive tutorials** as a distinct content type beyond reading + practice questions? (User listed it; current codebase has only reading + chat.)
- Are jobs hub, community forum, mentor marketplace, and office hours still in the product? They're in the codebase as stubs but absent from the user's restated goals.
- Should the dashboard be the primary landing surface or should it be the learning flow itself?
- Sector deep dives (TMT, healthcare, FIG, etc.) — separate content type or just chapters within "which firms do what"?
- Does "track progress" mean a mastery model + heatmap (current codebase) or simpler completion tracking?

## Codebase changes implied by the spec

- Reorganize routing so the learning flow is a first-class IA surface (chapters → sections → practice), not a flat library of guides.
- Build a profile system seeded from a resume upload (resume parser + structured profile store). Currently no profile system exists.
- Extend the chatbot beyond guide-scoped Q&A: add tool use for profile lookup, networking history search, web search, firm data.
- Add a HireVue practice mode to the mock interview studio.
- Add a technical-question bank (DB-backed, with AI-generated fallback by topic/type). Currently no question bank exists.
- Add a "discover people to network with" surface in Relationship Memory.
- Replace stubbed auth with a real authenticated experience (Supabase, per existing stack decision).

---

## Resolved details

- **Interactive tutorials:** support all three formats (inline exercises, worked examples, AI socratic tutoring); each chapter author picks the right mix.
- **Discovery mechanism for new people to network with:** deferred — feature in scope, mechanism TBD.
- **Progress tracking:** hybrid — mastery model under the hood + completion stats and streak in the UI.
- **Calendar:** Google Calendar OAuth, auto-link events to contacts, trigger pre-event prep sheets.

## Updates from `IB_research.md` review (round 2)

- **Chapter sequence locked at 16 chapters**, with technicals as 7 of them (the bulk):
  1. Recruiting Cycle & Timeline
  2. How to Apply
  3. Firm Overviews (BB / EB / MM + group types)
  4. Sector Deep-Dives
  5. Resume & Cover Letter (uses Resume Coach)
  6. Networking Mastery (uses Relationship Manager)
  7. Behavioral & Fit (uses Story Framer)
  8. Technicals — Accounting & 3 Statements
  9. Technicals — EV vs Equity Value
  10. Technicals — Valuation: Comps & Precedent Transactions
  11. Technicals — DCF (own chapter; 23% of all reported IB Qs)
  12. Technicals — M&A & Merger Models
  13. Technicals — LBO Models
  14. Technicals — Brain Teasers & Mental Math
  15. Mock Interviews & HireVue Practice (uses Mock Interview Studio)
  16. Superday & Logistics
- **Recruiting Cycle Widget** added to the dashboard — personalized to grad year + current semester, surfaces what to focus on this semester. Goal #13.
- **Profile** now stores current semester (in addition to grad year), to drive the cycle widget.
- **Technical Question Bank** extended with three new behaviors:
  - Difficulty levels (easy / medium / hard) per question.
  - Follow-up question trees: 3–5 deeper probes per Q, fired on correct answer.
  - Spaced re-surfacing of weak/incorrect questions every 2–3 days. (Note: this is *not* the standalone flashcard feature — that stays cut. This is in-Q-bank re-serving driven by mastery model state.)
- **Mock Interview Studio** now includes adaptive follow-up questions that branch off each answer, mimicking real interviewer probing.
- **Firm Pages** now include 10–15 firm-specific interview questions per firm (sourced from interview reports), in addition to earnings/deals/intel.
- **Brain Teasers & Mental Math** added as a dedicated technical chapter (was missing before).
- **DCF promoted to its own chapter** (separate from Comps/Precedents) given its outsized weight in real interviews.
- **School-tier-aware strategy** considered but NOT picked. Profile data is captured; we can revisit later if it earns its place.

## Architecture decisions

### Stack (locked 2026-05-09)

- **Framework / lang:** Next.js 16 App Router + TypeScript (unchanged from current).
- **UI:** Tailwind v4 + shadcn/ui (unchanged).
- **Auth:** Supabase Auth — email + Google OAuth. Replaces stubbed auth in current prototype.
- **Database / ORM:** Supabase Postgres + Drizzle ORM (unchanged choice; new in build — no DB exists in current prototype).
- **Vector store:** **pgvector inside Supabase Postgres**. Not a separate vector DB. RLS applies normally; joins to `contacts`/`chats` are direct.
- **Object storage:** Supabase Storage for resumes and mock-interview audio. Per-user prefixes; signed URLs.
- **LLM:** Anthropic Claude — server-side only.
- **AI SDK layer:** **Hybrid — Vercel AI SDK for the chatbot UI** (`useChat` for tool-using streaming), **raw `@anthropic-ai/sdk` everywhere else** (explain, beginner mode, scoring, prep sheets, structuring) so we keep tight control of prompt caching and tool-use details.
- **Web search tool:** **Anthropic's native `web_search` tool**. No separate Tavily/Exa/Brave vendor.
- **Embeddings:** **Voyage AI `voyage-4-lite`** as default (queries + most documents), **`voyage-4-large`** available for high-quality indexing where it earns its place. Voyage 4's MoE means lite/large share a vector space — no re-indexing needed to swap.
- **Speech-to-text:** **Groq Whisper Turbo**. Replaces OpenAI Whisper API plan.
- **Resume parsing:** **Two-stage — `pdf-parse` for text extraction, then Claude tool use for structured profile JSON.** Not Claude vision and not a dedicated parser like Affinda.
- **Background jobs:** **Inngest**. Used for: spaced re-surfacing of weak Q-bank items, weekly firm-data refresh, prep-sheet pre-generation, embedding backfills, scheduled follow-up reminders.
- **Rate limiting:** **Upstash Ratelimit + Upstash Redis** sliding-window. Required, not optional, on every AI endpoint.
- **Calendar integration:** **Direct Google Calendar API + OAuth 2.0** (granular consent). Not Nylas, not Cronofy.
- **Email:** **Resend** + React Email templates for both auth and Relationship Manager follow-up sends.
- **Analytics:** **PostHog** (cloud) for product events, funnels, replays, feature flags.
- **Error + perf monitoring:** **Sentry**. Axiom optional later for AI-call log streaming.
- **API style:** **Server Actions for mutations** (save story, log chat, create contact, etc.) + **Route Handlers for streaming endpoints and external webhooks** (Claude SSE, Inngest, Google Calendar). Replaces the current codebase's pure-Route-Handler approach.
- **Testing:** **Vitest (unit) + Playwright (e2e on critical flows)**. LLM calls mocked.
- **CI/CD:** **GitHub Actions on PRs (typecheck + lint + tests) → Vercel preview deploys → manual promotion to prod.** Not auto-deploy.
- **Hosting:** Vercel (unchanged).
- ~~**Deferred from stack:** HireVue-style video capture and storage. Voice-only mock interviews in phase 1.~~ **Reversed 2026-05-11 — HireVue is back in phase 1.** Stack: **browser `MediaRecorder` API → Supabase Storage** (no Mux, no Cloudflare Stream, no transcoding pipeline). Cheapest path; playback UX is "good enough" for practice video. Migration to Mux later is straightforward if needed. Project-overview Goal #5 ("voice mock interviews and HireVue-style video practice") now aligns with architecture again.
- **Video retention:** 30 days (matches mock-audio retention). Transcripts and scorecards persist forever; raw video expires via the same Inngest cron that handles audio.
- **`mock_sessions.mode`** field added: `voice` | `hirevue`. **`mock_turns`** stores either an `audio_url` or `video_url` depending on session mode.

### System Boundaries (locked 2026-05-11)

- **Routing model:** *learning flow as the spine + tools layered on top.* `app/(app)/learn/[chapter]/[section]` is the spine; `app/(app)/tools/{chatbot,story-framer,resume-coach,mock-interview,question-bank,relationships}` is the toolset; `app/(app)/{dashboard,firms,sectors,profile,progress}` are top-level surfaces. **This is a re-architecture from the current codebase**, which has a flat `(app)/` with all features as siblings.
- **Server Actions for mutations + Route Handlers for streaming/webhooks only.** Replaces the current "everything is a Route Handler" pattern.
- **`lib/` is domain-driven** (one folder per concern) with explicit public APIs and enforced boundary rules. Replaces the current `lib/ai`/`lib/data`/`lib/supabase` minimal split.
- **`components/`** split into `ui/` (shadcn primitives), `learn/`, `tools/*/`, surface-specific folders, and `shared/`.

### Storage Model (locked 2026-05-11)

- **Four physical stores:** Postgres (Supabase + pgvector), Supabase Storage, Upstash Redis, MDX files in repo.
- **Hybrid content model:** reading prose in MDX (reviewable in PRs); practice questions, tutorials, follow-up trees in Postgres (queryable, AI-extendable, drives spaced re-surfacing).
- **Granular mock-interview schema:** `mock_sessions` → `mock_turns` (per Q-A pair with adaptive follow-up chain) → `mock_scorecards`. Enables cross-session analytics.
- **Storage retention policy:** resume PDFs persisted indefinitely; mock-interview audio expires after **30 days** via an Inngest cron; transcripts and scorecards persisted forever.
- **pgvector embeddings live inside Postgres** on the rows that need them (`chats.embedding`, `qbank_questions.embedding`, `firm_data.embedding`). No separate vector DB.
- **Tables added that don't exist in current codebase:** `profiles`, `experiences`, `resumes`, all learning-flow tables, `topic_mastery`, `streaks`, `stories`, all mock-interview tables, all qbank tables with spaced-rep state, `chats` with embeddings, `calendar_events`, `outreach`, `prep_sheets`, `firms`+`firm_data`+`firm_interview_questions`, `sectors`, `chat_threads`+`chat_messages`, `llm_usage`, `audit_log`, `admins`.

### Auth and Access Model (locked 2026-05-11)

- **Two roles:** `user` (default) and `admin` (founder + future content editors). Admins write shared content (chapters metadata, firms, sectors, qbank). Role mirrored into the Supabase JWT via an auth hook from an `admins` table.
- **RLS is the enforcement layer.** Every user-owned table scoped by `user_id = auth.uid()`. Service-role key reserved for `lib/inngest/**`, webhook handlers, and explicit admin ops.
- **Onboarding:** profile required (school, grad year, current semester, target firms). **Resume upload is optional** but heavily prompted; tools that need it (Resume Coach, experience-driven Story Framer) gate themselves accordingly. `profiles.onboarded_at` is the completion flag.
- **Account deletion supported in phase 1** (self-serve, cascading delete across DB + Storage + PostHog). **Data export deferred to phase 2** — manual via email until then.
- **All LLM API keys** (Anthropic, Voyage, Groq) live server-side only; never touched by client code.

### Invariants (locked 2026-05-11)

Ten rules the codebase must never violate. Highlights — full list in architecture.md:

1. All LLM/embedding/STT calls server-side.
2. No free-form JSON parsing from LLM output — tool use with Zod schemas only.
3. RLS on every user-owned table; service-role key gated to background/admin paths.
4. Every LLM call writes one `llm_usage` row.
5. Rate-limit wrapping on every AI-calling Server Action and Route Handler.
6. Mutations through Server Actions, not Route Handlers.
7. Prompt caching default for >1K-token stable system content.
8. Background work in Inngest, not in request handlers.
9. Folder boundaries enforced (`components/` ↛ `lib/db`/`lib/ai`; `lib/` ↛ `components/`/`app/`; `lib/db` ↮ `lib/ai`).
10. Postgres is the source of truth for everything user-authoritative.

---

## Updated open questions

- ~~Project overview Goal #5 vs HireVue deferral.~~ **Resolved 2026-05-11 — HireVue is back in phase 1; overview and architecture aligned.**
- Confirm Inngest is the chosen background-job vendor in production (vs. moving to a self-hosted queue later when scale demands it).

## UI Context decisions (locked 2026-05-11)

Direction picked from a 4-aesthetic visual shotgun (samples in `templates/samples/`):

- **Aesthetic:** Modern edtech with finance gravity. (Sample `2-modern-edtech.html`. The other three — premium banker, terminal-dark, Linear-minimal — explicitly rejected.)
- **Mode:** Light mode only in phase 1. Dark deferred.
- **Accent:** Emerald `#047857` / `oklch(0.55 0.15 160)`. Stays unchanged from current codebase. Explored five other greens (jade, teal, hunter, forest, pine) and two non-greens (indigo, burgundy); emerald held up best.
- **Typography:** Geist Sans + Geist Mono. Stays unchanged. Explored Inter, Source Serif 4 + Inter, Fraunces + Inter; Geist held up.
- **Border radius base:** 0.75rem; sm/md/lg/xl scale derived. Unchanged.
- **Component library:** shadcn/ui `new-york` style on Tailwind v4. Customize by editing files in `components/ui/`, not by wrapping.
- **Icon library:** Lucide React only. Strict 14/16/20px scale.
- **Layout patterns documented:** marketing single-column; signed-in app shell (left sidebar + main); chapter reader (3-column with natural-flow center, sticky rails); tool surfaces (single max-w-4xl column); firm/sector pages (2/3-1/3 split); dashboard 12-col grid; modals via shadcn Dialog; forms via shadcn Form + react-hook-form + Zod; skeletons for loads; token-by-token streaming with cursor.
- **Motion rules:** 200ms default; subtle card lift on hover; reduced-motion respected.

The currently-shipping UI is essentially the locked target, with two notable additions implied by the architecture:

- **Sidebar nav reorganization** to reflect the spine-and-tools IA: Dashboard, Learn, Tools (chatbot/story-framer/resume-coach/mock-interview/question-bank/relationships), Firms, Sectors, Profile, Progress. Replaces the current flat 11-item sidebar that lists every feature as a sibling.
- **Reader 3-column layout** preserved with explicit "natural flow center, sticky rails" rule documented as a do-not-break invariant (it has been broken before).

## Code Standards decisions (locked 2026-05-18)

### TypeScript
- **`strict: true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`.** Three extras chosen because together they catch ~40% of runtime bugs strict alone misses.
- **`any` banned**, `unknown` for external input, `as` only for already-validated external shapes.
- **Branded types for IDs** (`UserId`, `ContactId`, etc.) to prevent ID mix-ups at the type level.
- **Parse, don't validate, at boundaries** — every external input flows through Zod before reaching business logic.

### Next.js + React
- **Server Components by default.** `'use client'` only for interactivity/hooks/browser APIs.
- **Server Actions for all mutations**; Route Handlers for streaming, webhooks, health only.
- **Server Action return shape:** discriminated union `{ ok: true, data } | { ok: false, error: { code, message, fieldErrors? } }`.
- **Standard Server Action skeleton** documented: requireUser → Zod parse → rate limit → ownership check → work → log → return.
- **Zod schemas colocated with the action** that uses them; extracted to `schemas.ts` siblings only when the client form needs them too.
- **Client state strategy:** `useState` + URL query params + Server Components for data. No Zustand/Jotai/Redux/Context until a concrete cross-component case demands it.
- **`react-hook-form` + Zod resolver** for forms with >3 inputs; same schema used on client and server.
- **No `useEffect` for data fetching.** Server Components or Server Actions only.

### Drizzle / Data Access
- **Module-per-domain query files** in `lib/db/queries/<domain>.ts`. Named-function exports, no class repositories.
- **Functions take `(db, ...args)` explicitly** so the same function works inside transactions.
- **Transactions for multi-step mutations** that must atomically succeed or fail. No external HTTP calls inside transactions.
- **Indexes on every FK + every WHERE/ORDER BY column**, added in the same PR as the query.
- **Migrations generated by Drizzle Kit**; never edited in place.
- **No raw SQL outside `lib/db/queries/`**.
- **No mocking the database in tests** — real Postgres or PGlite.

### Errors + Logging
- **Custom `AppError` hierarchy in `lib/errors.ts`:** `ValidationError`, `UnauthorizedError`, `NotFoundError`, `RateLimitedError`, `LLMError`, `ExternalServiceError`. Translated to discriminated-union failures at the Server Action boundary; unknowns captured to Sentry.
- **Pino structured logger** in `lib/logger.ts`. Standard fields `userId`, `action`, resource IDs. Levels: `error`/`warn`/`info`/`debug`. `console.log` banned by ESLint.
- **Sensitive data redaction** via pino's `redact` config; LLM outputs logged as token counts + 80-char preview only.

### Dates
- **Postgres `timestamp with time zone`** in UTC; ISO 8601 over the wire.
- **Native `Date` + `date-fns`** (tree-shakeable). No moment, no luxon, no day.js.
- **Immutable use only** — never `Date.setX()`.
- **User-facing display in local timezone** via `Intl.DateTimeFormat`.

### Naming
- **Files:** `kebab-case.tsx`.
- **Folders:** `kebab-case`.
- **React components:** `PascalCase` named exports inside kebab-case files.
- **Hooks:** `use-camel-case.ts` exporting `useCamelCase`.
- **Functions/variables:** `camelCase`.
- **Constants:** `SCREAMING_SNAKE_CASE` for true compile-time only.
- **Types:** `PascalCase`, no `I` prefix.
- **Zod schemas:** `camelCaseSchema`; inferred type drops the `Schema` suffix.
- **DB tables/columns:** `snake_case` plurals.

### Exports + Imports
- **Named exports throughout.** Default exports only where Next.js requires (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx`, `template.tsx`, `route.ts`, middleware, Inngest handler).
- **Path alias `@/` for all cross-folder imports**; `./` for siblings.
- **Import order auto-sorted by Prettier:** built-in → third-party → `@/` → relative.

### Comments
- **Light. Comment the non-obvious WHY + brief orientation comments on substantial sections of code** (the user's explicit preference, slightly more than "minimal" — encourages 1-line section summaries on 30+ line blocks, especially in `lib/ai/` prompts, `lib/mastery/` math, Inngest functions). No JSDoc on every function. No "added for X" notes.

### Styling
- **Tailwind utility classes only.** No CSS modules, no styled-components.
- **Tokens, not hex.** `bg-primary`, never `#047857`.
- **Radius scale from `ui-context.md`.**
- **`cn()` helper for conditional classes.**
- **shadcn primitives edited in place**, never wrapped.

### Testing
- **Vitest** for unit; **Playwright** for critical e2e flows.
- **LLM calls mocked** in CI; **real DB** in integration tests.
- **No coverage targets** — meaningful tests over high numbers.

### CI/Quality Gates
- **ESLint + Prettier on every PR via GitHub Actions.** Custom ESLint rules: no `console.log`, no `any`, no default exports outside Next.js conventions, no imports of server-only modules from `components/**`.

## AI Workflow decisions (locked 2026-05-18)

- **Agent default mode:** plan first, then execute. Trivial tasks skip the plan step. Plan includes user-visible behavior, steps, files to touch, risks, and verification step. Wait for approval before coding.
- **Slicing:** tracer-bullet vertical slices. Each unit ships one user-visible behavior end-to-end (migration + query + Server Action + UI + tests). Each PR independently shippable.
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`). One feature per PR; PR description = what / why / how-to-verify, 1–3 bullets each.
- **Protected files (no AI edits without explicit ask):** `components/ui/*`, `lib/db/migrations/*`, `templates/context/*`, `.env*`. `content/chapters/*` left editable.
- **Doc-sync responsibilities** spelled out per topic: architecture changes → `architecture.md`+`CHANGES.md`; UI tokens → `ui-context.md`; new code rule → `code-standards.md`; feature scope shift → `project-overview.md`+`CHANGES.md`.
- **"Done" definition** for a unit: works e2e, no invariant violated, `progress-tracker.md` updated, typecheck + lint + tests pass, `pnpm build` passes, PR merged.

## Progress Tracker decisions (locked 2026-05-19)

- **Migration strategy: in-place migrate** (Option 2). Decided after a corrected audit of `/web` that found ~50–60% spec alignment already (Sentry, Upstash, PostHog, Pino, Supabase auth helpers, real DB tables, testing infra all installed). Greenfield rebuild was considered and rejected as wasteful given the foundation that already exists.
- **First seven implementation units defined** in `progress-tracker.md` Next Up:
  1. Cleanup (` 2.ts` files + cut routes)
  2. Dependency parity (Drizzle, Inngest, Voyage, Groq, Google APIs, Resend, react-hook-form, date-fns)
  3. Drizzle wrap (introspect existing Supabase tables, prove pattern with one query)
  4. Auth UI + middleware
  5. IA refactor (spine + tools)
  6. Server Action pattern proof (one mutation migrated)
  7. First net-new feature (Q-Bank tracer-bullet)

## Spec file status

- [x] `context/project-overview.md` — drafted, awaiting review
- [x] `context/architecture.md` — Stack, System Boundaries, Storage Model, Auth and Access Model, Invariants all drafted
- [x] `context/ui-context.md` — Theme, Colors, Typography, Border Radius, Component Library, Layout Patterns, Icons, Motion all drafted
- [x] `context/code-standards.md` — General, TS, Next.js, React, Styling, Server Actions, Data Access, Storage, Naming, Exports/Imports, Comments, Errors, Logging, Dates, Testing, Performance, Linting, File Organization
- [x] `context/ai-workflow-rules.md` — Approach, Scoping, Slicing, Splitting, Missing Requirements, Protected Files, Commits + PRs, Doc Sync, Done Definition, When Things Go Wrong
- [x] `context/progress-tracker.md` — Current phase, completed work, in progress, 7-unit backlog, open questions, architecture decisions reference, session notes

**All six spec files now drafted.** Spec-authoring phase complete; implementation phase begins.

## Unit 3 — Drizzle wrap (implemented 2026-06-02)

Implemented per `feature-specs/unit-3-drizzle-wrap.md`, with two deviations from the spec's assumptions worth recording:

- **Introspection: custom postgres.js generator, not `drizzle-kit pull`.** `drizzle-kit pull` reliably hangs against this project's Supabase pooler (it prints "Pulling from public" then deadlocks — its internal parallel catalog queries don't survive Supavisor). A plain `postgres.js` connection runs the same catalog queries in ~1s. So `scripts/introspect.mjs` reads `pg_catalog`/`information_schema` and emits `lib/db/schema/<table>.ts` per table + an `index.ts` barrel. It is **deterministic** — re-running against an unchanged DB produces no diff — which preserves the spec's reproducibility requirement. It captures columns, types (incl. `text[]` arrays and `vector(N)` pgvector dims), nullability, primary keys, and the common `gen_random_uuid()`/`now()` defaults. **Not captured (future enhancement):** FK constraints and index definitions — not needed for typed querying. `pnpm db:pull` runs this generator; `drizzle.config.ts` (for `generate`/`migrate`) is retained for future Drizzle-managed migrations.
- **RLS: `withUser(token, fn)` wrapper in `lib/db/client.ts`** (the spec's recommended hybrid option 3). Runs `fn` inside a transaction that sets `request.jwt.claims` + `set local role authenticated`, then resets — so `auth.uid()`-based RLS policies apply even though the pooler connection itself is privileged. Role value is whitelisted before interpolation.

Other notes:
- **Connection:** `DATABASE_URL` = transaction pooler (port 6543, `prepare: false`) for app runtime; `DIRECT_URL` = session pooler (port 5432) for schema ops. Both on `aws-1-us-east-2.pooler.supabase.com`. drizzle-kit env is loaded via Node's native `--env-file=.env.local` (no `dotenv` dependency added).
- **Introspected tables (15):** the DB still contains the cut `jobs` and `applied_jobs` tables (Unit 1 removed their app code, not the tables). They're introspected as-is; a cleanup migration to drop them can come later.
- **Migrated call site:** the profile *read* in `app/api/chat/general/route.ts` now uses `withUser(...) → getProfile(tx, userId)` from `lib/db/queries/profile.ts`. `lib/data/profile.ts` and its other callers (`lib/ai/assistant-tools.ts`, the save route) are untouched — both paths coexist, per spec.
- **Verification:** custom introspection determinism check (no diff on re-run), typecheck ✅, lint ✅, 3 Vitest unit tests for `getProfile` ✅, `pnpm build` (see progress-tracker).

---

## Unit 11 — Learning-flow curriculum + Question Bank (2026-07-12)

Implemented the full curriculum and daily workflow so a new user is carried end-to-end (per `context/curriculum.md`).

- **Curriculum manifest** (`lib/curriculum/chapters.ts`): the 16-chapter spine as static data — sections, slugs, spine-vs-reference kind, gated flag, per-chapter tool exercise, and ⭐ advanced sections. Single source of truth; section prose stays as flat MDX in `content/guides/` referenced by slug (reuses the existing `/guide/[slug]` Reading-Lens reader — no reader rewrite).
- **Gates decision (Jake):** hard gate on the technical spine chapters (8–13) via an 85% mixed quiz, but **all content stays browsable to everyone** — gates control progression/completion, not access. Non-technical chapters are ungated.
- **AI grading with a PUBLISHED rubric** (`lib/ai/grading.ts`): Claude (Sonnet) tool-use grades free-text answers on key points (weighted), misconceptions asserted, and **depth calibration** (answer at interview depth and stop) — the differentiator vs black-box graders. Shared by the Question Bank, section drills, chapter gates, and daily drill via `gradeAnswerAction`.
- **Follow-up trees**: a correct main answer opens the question's deeper probes (`qbank_followups`), chained.
- **Spaced re-surfacing + mastery** (`lib/mastery/`): pure functions. Weak/incorrect questions resurface in 2–3 days until answered correctly twice; per-topic EWMA mastery drives dashboard weak-areas. Computed at write/read time (no Inngest yet, matching the Unit-8 PRD decision).
- **Parameterized drill generators** (`lib/curriculum/drills/`): 3-statement change, TSM, accretion/dilution, paper-LBO — random numbers each round (memorization-proof), checked locally (no LLM).
- **Content generation:** ~63 new section MDX readings + ~500 rubric-graded questions authored by parallel Sonnet agents, grounded in the `extra_content/` PDFs (used for facts/coverage/sequencing per Jake) but written as **original prose** — no BIWS/M&I text, names, or worked-example numbers reused (copyright posture from `curriculum.md` §7).
- **New surfaces:** `/learn` (chapter grid + continue-where-you-left-off), `/learn/[chapter]`, `/learn/[chapter]/drill/[section]`, `/learn/[chapter]/practice` (gate); Question Bank studio (daily interleaved drill + due queue, practice-by-topic, mental-math generators); dashboard rebuilt on real data (recruiting-cycle widget from profile semester, weak areas, due count, continue-flow).
- **Advanced-track toggle**: onboarding + profile; persisted on `profiles.advanced_track`; gates the ⭐ sections and advanced questions.
- **Schema:** migration `0006_curriculum.sql` (qbank_questions/followups/attempts/spaced_state, topic_mastery, section_progress, chapter_progress, profiles.advanced_track; RLS owner-scoped on user tables, read-only shared content). `0007_qbank_seed.sql` generated from the seed JSON by `scripts/build-qbank-seed.mjs`.

---

## Prod-readiness relay session 1 — Phase 1 security & correctness (2026-07-15)

First cloud run of the `fable/prod-readiness` relay (see `context/RELAY-QUEUE.md`). All commits on `fable/prod-readiness`; every commit verified with typecheck + lint + full vitest (+ build for non-trivial changes).

- **Fixed the fix-first AI usage-logging bug** (`lib/ai/usage.ts`): Supabase query builders are lazy thenables — `void admin.from("ai_usage").insert(...)` never attached `.then()`, so the insert never fired and cost tracking silently no-oped. Now subscribed with error logging + a regression test that models the lazy builder (the old test's eager-promise mock hid the bug).
- **Decision — CSP without nonces:** security headers (CSP, HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy) are set via `next.config.ts` `headers()`. `script-src` keeps `'unsafe-inline'` because nonce-based CSP forces fully dynamic rendering (kills static/ISR caching), which conflicts with the Phase 2 performance goal. External origins (Supabase, PostHog, Sentry ingest) derive from env at build time.
- **Decision — lazy Drizzle client** (`lib/db/client.ts`): the module-scope `DATABASE_URL` throw broke `next build` page-data collection in any env without DB creds (including CI, whose build step has no DATABASE_URL). Client now created on first use; same fail-fast error at first query. No caller imported `db` directly (all go through `withUser`), so the export became `getDb()`.
- **Error hygiene:** new `lib/security/client-error.ts`; 12 routes stopped returning raw upstream error text (SDK/parser/Postgres internals) to clients — logged server-side, generic display-safe message returned. Streaming routes emit a generic `[Error: ...]` line.
- **LLM trust boundary:** assistant tool arguments (chat/general) are Zod-validated per tool; tool failures return generic errors (raw internals no longer flow back through the model). Tool *output* is Zod-validated before returning in structure-chat, draft-outreach, and resume/critique (extra keys stripped; 502 on shape mismatch).
- **Ownership check on service-role write:** structure-chat's `chat_embeddings` upsert (PK = client-supplied `chat_id`, RLS bypassed) now verifies the chat row belongs to the caller + matches the contact before writing (closes finding #2 of security-review-2026-06-01).
- **Decision — split rate-limit store-failure policy** (`lib/ratelimit/limiters.ts`): AI-spend limiters (qbank grading) now **fail closed** on Upstash errors/missing prod env (unmetered Claude spend is worse than a blocked grader); auth/CRUD limiters keep the documented degrade-open policy (an infra outage must not block sign-in). Unit-tested both ways.
- **Monthly AI spend cap enforced** (finding #3): `requireUser` checks `assertUnderQuota` on expensive/whisper tiers (and `spendCap: true` for AI-on-cheap-tier routes, e.g. profile/extract-resume). Default $20/user/month via `AI_USER_MONTHLY_CAP_USD`.
- **Markdown link scheme guard** (finding #20): the shared renderer (which renders model output) only links http(s)/mailto/relative/anchor hrefs; anything else renders as plain text.
- **Deps:** removed 12 unused packages (googleapis, ai + @ai-sdk/anthropic, @react-email/components, inngest, groq-sdk, framer-motion, next-mdx-remote, rehype-slug, remark-gfm, drizzle-zod, resend) — zero imports; reinstall when the owning feature lands (closes finding #17).
- **Sentry build plugin wired** (finding #10): `withSentryConfig` uploads + deletes source maps when `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` exist; no-op otherwise. Env task filed to jakes-tasks.
- **CI:** push trigger fixed `main` → `master`; four pre-existing blocking ESLint errors fixed (unescaped entity; three sync-setState-in-effect via rAF); stale test mocks/fixtures repaired (chat/general now mocks the Drizzle layer; onboarding fixture gained required `advancedTrack`; critique fixture updated to the endpoint's actual contract).

---

## Prod-readiness relay session 2 — Phase 2 performance (2026-07-16)

Measure-first pass on the "long loading times" complaint. Every commit on `fable/prod-readiness`, gated on typecheck + lint + full vitest (+ build). Baseline: build green, 325 tests passing.

**What the measurement found (the latency story per authenticated navigation):**

1. Proxy called `auth.getUser()` (network RT to Supabase Auth) + a PostgREST `profiles.onboarded_at` read; then the `(app)` layout called `getUser()` again, and the page a third time — 4 network calls before any page data.
2. `withUser` spent 8 pooler statements per transaction (BEGIN, 3 setup, 3 teardown, COMMIT) around the actual queries.
3. Pages issued independent reads with sequential awaits (dashboard: 5 serial round trips; learn pages: 3; question bank: 3 + a second full transaction).
4. Index audit (all migrations vs every query in `lib/data`/`lib/db/queries`): two sorted reads lacked covering indexes; ten single-column indexes were strict prefixes of existing composites; the pgvector RPC ran at default `ivfflat.probes = 1` (poor recall on per-user filtered ANN).
5. Prompt caching: all Anthropic routes with >1K stable tokens already set `cache_control`; the uncached remainder are OpenAI-backed (automatic caching) or sub-1K prompts — invariant satisfied, no change.
6. Bundle (Turbopack, no analyzer support): largest client chunks are Sentry (~590K min across two chunks — includes Replay, which is a deliberate error-replay choice from session 1; Turbopack doesn't support Sentry's treeshake options) and zod v4 (~256K, shared by client forms). Documented, not changed — no safe, non-invasive fix under Turbopack today.

**Fixes (baseline → after, structural round-trip counts — no live DB reachable from the cloud box, so these are statement/RT counts, not wall-clock):**

- `withUser` overhead: 8 statements → 3 per call (one `set_config(claims, sub, role)` SELECT; teardown dropped entirely — `is_local=true` GUCs revert on COMMIT/ROLLBACK). 28 call sites benefit.
- `auth.getUser()`: 2 calls per render pass (layout + page) → 1 via React `cache()`; `getCurrentUserOrNull` shares the memo.
- Proxy onboarding read: 1 PostgREST RT per navigation → 0 after first hit (memoized in an httpOnly cookie keyed to the user id; onboarding is one-way so staleness can't occur; forgery only skips a UX redirect, data stays behind RLS).
- Dashboard queries: 5 serial RTs → 1 pipelined batch (postgres.js pipelines concurrent queries on the transaction connection — verified in its `connection.js` sent-queue/max_pipeline logic). Same for learn index/chapter (3→1) and question bank (3→1, plus its second transaction folded into the first: 2 transactions → 1).
- Net per dashboard navigation: ~17 network round trips → ~7.
- Migration `0009_perf_indexes_2.sql` (file only; apply filed to jakes-tasks): `chats(user_id, contact_id, happened_at desc)`, `applied_jobs(user_id, stage, added_at desc)`, drops the ten prefix-redundant indexes, recreates `match_chat_embeddings` with `SET ivfflat.probes = 10` (~sqrt(lists=100)).
- Loading skeletons added to every DB-backed route that lacked one (learn ×4, question-bank, onboarding) so navigation paints immediately.
- **Decision — removed the dead `lib/cache` layer** (`wrap.ts`, `tags.ts`): zero consumers, and its doc comment falsely claimed public reads were wrapped. All public pages render static seed/fs data, so there is nothing to cache today; git history keeps it if a wiring pass ever has a real target. `RUNTIME-AUDIT.md` moved to `web/docs/api-route-runtime-audit.md`.
- **Observation (not changed):** `lib/analytics/` (PostHog provider + typed event helpers) has zero consumers — the provider isn't mounted and no helper is called. Wiring it is product work (what to track, consent posture), left for Phase 5 / Jake.

---

## Prod-readiness relay session 2 (continued) — Phase 3 UX fixes & bugs (2026-07-16)

Screen-by-screen review done via parallel code-review agents (no env/creds in the cloud box, so no live browser run — Playwright e2e needs a running dev server with Supabase env). Every credible finding verified against the code before fixing. All fixes gated on typecheck + lint + full vitest + build.

**Fixed (high severity):**

- **No mobile navigation existed at all** — the sidebar is hidden below `lg` with no fallback; phone/tablet users couldn't leave whatever page they landed on. Added a sticky top bar + Sheet drawer sharing the sidebar's nav data; `(app)` layout stacks header-over-main below `lg`.
- **Failed chapter-gate scoring displayed as a pass** — `practice-session.tsx` fell through to the ungated "passed" tally when `finishSittingAction` returned `{ok:false}` (and a thrown action wedged the Finish spinner). Now errors stay on-screen with retry; section drills also no longer claim "chapter complete" (only the gate is pass/fail).
- **"Take the gate" was reachable without reading** — `disabled` on an `asChild` Link is a no-op on anchors; unread state now renders a real disabled button.
- **Product tour re-appeared forever on mobile** — running out of visible step targets unmounted the tour without recording completion; it now completes. Also `measure()` treated `display:none` targets (0×0 rect) as present, spotlighting a tiny box in the corner.
- **Relationships AI actions lied on failure** — structure-notes showed a success toast + empty sections on 429/500; draft-follow-up rendered a blank email with a working Copy button. Both now branch on `res.ok` with rate-limit-aware copy.
- **Progress page fabricated the user's stats** — hardcoded weak areas/mastery/streak and a `Math.random()` heatmap presented as real data. Rebuilt on `topic_mastery` + recent qbank attempts + due-review count, with a new tested pure helper (`lib/mastery/activity.ts`) for streak/heatmap math and honest empty states.
- **`lib/mastery/mastery.test.ts` never ran** — vitest's include globs only covered `tests/**`; colocated `lib/**/*.test.ts` now included (suite 325 → 346, all passing).

**Fixed (medium/low):** mock-interview "Save to story bank" fired a success toast for a no-op (now disabled + SOON); mic errors branch NotAllowedError/NotFoundError with feature-detection instead of raw TypeError text; transcribe/score/critique/extract parse JSON safely and carry 120s timeouts (a hung request wedged the spinner); chat-panel gets status-aware failure copy (429/401/500), restores the typed prompt for retry, scrolls on new-message only, aria-label on send; resume-coach enforces the 5 MB cap client-side, disables the dropzone mid-extract, resets the file input; reading-lens hides the selection popover below `md` (Explain streamed tokens into a rail that doesn't exist there — spending money invisibly) and drops the dead Highlight/Note buttons; question-bank topic practice and mark-read surface action failures; delete-application asks for confirmation; 7 contact links stopped bouncing through the legacy `/relationships/:id` 301; "Add contact" CTA labeled SOON instead of dead-ending on a stub; reset-password's "link expired" error links to /forgot-password; login drops the redundant generic banner when field errors are shown; advanced-track toggles get `role="switch"`/`aria-checked`; drill inputs get label/id pairs; user-facing error copy no longer references ANTHROPIC_API_KEY/env vars (3 sites).

**Known remaining (Phase 3 backlog, not regressions):** relationships + firm pages render seed/demo data under first-person copy (needs the real-data wiring slice — `lib/data/*` Supabase reads exist but are only used by chatbot tools); contacts-view stage changes aren't persisted (in-memory TODO); chat stream mid-error arrives as literal `[Error: …]` text in-band (protocol change needed); mock-studio in-flight fetches aren't aborted on unmount (timeouts added; full AbortController plumbing deferred).

---

## Relay-chain audit — `.scratch/<feature>/issues/` was invisible to cloud sessions (2026-07-16)

`RELAY-QUEUE.md` Phase 5 names `.scratch/<feature>/issues/` (Units 8/9/10) as a backlog
source, but the entire `.scratch/` directory was gitignored — a fresh cloud clone never
had these files, only Jake's local machine did (the same problem already called out for
`.scratch/code-review-2026-07/findings.md`, just unnoticed for the other three
subdirectories). Narrowed `.gitignore` to `.scratch/code-review-2026-07/` only (that one
stays untracked — public repo, live vuln details) and committed the Unit 8/9/10 PRDs +
issues so cold sessions can actually read them. **Not re-verified for staleness**: qbank
migrations already in the repo (`0006_curriculum.sql`, `0007_qbank_seed.sql`,
`0008_profile_tour.sql`) don't match Unit 8/9/10's planned numbering
(`0006 qbank / 0007 chat threads / 0008 calendar`), meaning some of this backlog may
already be partially built via ad-hoc local sessions — the next session to pick up Unit
8/9/10 should diff the issue against current `web/app` + migrations before implementing,
not assume the PRDs describe a green field.

---

## Prod-readiness relay session 3 — Phase 3 backlog closed (2026-07-16)

Four commits (`15765e0`…`4f38996`), each gated on typecheck + lint + full vitest + build. Suite 346 → **353 passing**.

- **Stream mid-error protocol** — the five plain-text streaming routes (chat/stream, lens/explain, lens/beginner, relationships/prep-person, firms/prep) appended literal `[Error: …]` prose to the byte stream on mid-stream failure, which clients rendered as if the model said it. New `lib/streaming/stream-error.ts` frames the client-safe message with an ASCII record separator (stripped from model deltas as insurance; unit-tested), and `lib/ai/stream-response.ts#streamTextResponse` replaces ~30 lines of identical ReadableStream boilerplate per route. All four consuming components split the accumulator, keep partial content, render the error as a styled `role=alert` line; the chat panel restores the typed prompt for one-click retry. Dev-facing "check ANTHROPIC_API_KEY" copy removed from user-visible error paths.
- **Mock-studio abort-on-unmount** — transcribe/score fetches now share an AbortController aborted in the unmount cleanup (combined with the existing 120s timeout via `AbortSignal.any`); no more setState/toasts on an unmounted tree.
- **Relationships + firms real data** — the list/detail/firms pages rendered hardcoded seed contacts/chats/events/firms under first-person copy (the deepest dishonesty left). Now: `requireUser()` + pipelined `lib/data` reads, genuine empty states (contacts CTA empty state, calendar-tab default switched to contacts when eventless, firms empty note), seed arrays deleted. `/tools/relationships/new` is a real RHF+Zod form → `createContactAction`; pipeline stage changes persist via `updateContactStageAction` (optimistic override, revert + toast on failure) through new non-AI `contactsLimiter`. Fixed pipeline cards navigating to the legacy `/relationships/[id]` path.
- **Chat persistence** — nothing ever wrote to the `chats` table: "log a chat" structured notes into local state, so history/search/firm recall/embeddings all ran on nothing. `logChatAction` saves raw notes *before* the AI call (notes survive structuring failure; same-sitting re-structure updates rather than duplicates; stamps the contact's last-contact date for the nudges widget); `saveChatSummaryAction` persists the Zod-validated summary. The client now passes contactId+chatId to structure-chat — activating the pre-existing but never-exercised server-side pgvector embedding write — and prep-person gets contactId so prep sheets use semantic recall over real past chats.
- **Decision:** contact/chat mutations live in `lib/data/contacts.ts` (Supabase session-client style) rather than Drizzle/`withUser`, matching the domain's existing reads that the chatbot tools already use. The Server Actions still follow the 7-step skeleton.
- **Decision:** AI route schemas no longer require a non-empty `contactTitle` (user-created contacts may have none; prompts tolerate the blank).
- **Filed to jakes-tasks:** verify the production `firms` table contains seed.sql's firms insert — the firms pages + firm-prep route now read it exclusively.

---

## Prod-readiness relay session 3 (continued) — Phase 4 complete (2026-07-16)

- **CI gate 1 unblocked** — `pnpm format:check` (CI's first step) was failing on 89 files; applied `pnpm format` repo-wide (style-only, verified with typecheck+lint+full suite). All six CI steps now verified green locally.
- **`web/.env.example` regenerated** — from an audit of every `process.env.*` reference in app/scripts/configs/CI (no `.env*` file was read). Documents required vs optional + degradation behavior, server-only vs NEXT_PUBLIC, and script/test-only vars. Git-tracked via a `!.env.example` gitignore exception. Jake's open task moved to Done.
- **Docs drift fixed** — CONTRIBUTING.md referenced `LIVE_AI` (code reads `STREETPREP_E2E_LIVE_AI`) and "merge to main" (repo deploys from master).
- **Deps** — next/react patches were already current (session 1); bumped eslint-config-next 16.2.4→16.2.10 (match next), zod 4.3.6→4.4.3, @supabase/supabase-js 2.105.3→2.110.7. Each verified (typecheck/lint/353-test suite/build). Majors deliberately skipped (typescript 7, eslint 10, @anthropic-ai/sdk 0.111, @supabase/ssr 0.12 — not "safe patch" territory).
- **Robustness audit (agent-swept, hand-verified)** — two real gaps fixed: `interview/score` was the only Claude tool-call route that type-asserted `tool_use.input` instead of Zod-parsing (a non-array rubric from the model threw outside the try/catch → uncaught 500 on the core scoring flow; now parsed with a tolerant `ScorecardOutputSchema`, 502 + safe copy on mismatch); `profile/extract-resume` returned model JSON to the client unvalidated (now `ExtractedResumeOutputSchema`). Accepted-low, documented: whisper transcribe `as`-casts its verbose_json response but degrades via `??` fallbacks. Audit found no silent empty catches, no unvalidated Server Actions, no unverified webhooks (none exist).
- **New test** — integration test pinning the mid-stream failure contract on `/api/chat/stream` (200 + sentinel framing, partial content preserved, no raw upstream error text). Suite: **354 passing**.

---

## Prod-readiness relay session 3 (continued) — Phase 5 slice: follow-ups become real (2026-07-16)

`createFollowup`/`completeFollowup` in `lib/data/followups.ts` had zero callers: the "Upcoming follow-ups" widget could never display anything, the structured summary's `followUps` action items were discarded, and the AI-drafted follow-up email was lost on navigation. Now: `saveChatSummaryAction` creates followup rows from the summary (best-effort, deduped against the contact's open followups by note; model `dueBy` normalized by a unit-tested `followupDueDate` helper, default +3 days); the widget rows get a mark-done button backed by `completeFollowupAction` (optimistic hide, revert + toast on failure; `completeFollowup` now reports not-found instead of silently no-oping); `saveFollowUpDraftAction` persists the drafted email onto the chat row (`chats.follow_up_draft`, previously never written). Suite: **362 passing**.

---

## Prod-readiness relay session 4 — Phase 5: Unit 9 issue 01 shipped (2026-07-17)

`/tools/chatbot` is now a real streaming assistant with persistence (was a coming-soon stub).

- **Stack decision — AI SDK v7, not v6.** The Unit 9 PRD assumed `ai` v6; latest stable is now **7.0.31**. Installed `ai@7 + @ai-sdk/anthropic@4 + @ai-sdk/react@4` and coded against the v7 API verified from the installed `.d.ts` (v7 renames the persistence callback `onFinish`→`onEnd`, adds `usage.inputTokenDetails`). Bundle-vigilance: justified — replaces a hand-rolled fetch/reader/stream-protocol/persistence stack for every chat surface going forward; issue 02's tool loop needs it.
- **Migration `0010_chat_threads.sql`** — `chat_threads` + `chat_messages`, owner RLS, idempotent (Jake applies — filed). `content` jsonb holds the UIMessage `parts` array (tool parts in issue 02 need no schema change). A `seq` identity column provides total message order — `created_at` ties within a single batched insert, so ordering by timestamp alone is nondeterministic.
- **Anti-spoofing beats the PRD default**: the client sends only the newest turn (`prepareSendMessagesRequest`); the server reloads history from the DB, so client-supplied assistant turns (deferred finding #13 on the guide chat) are structurally impossible on this route. The user turn is persisted BEFORE the model call (survives stream failure); the assistant turn persists in `toUIMessageStreamResponse.onEnd`.
- **Usage invariant kept**: new `sdkUsageToTokenUsage` maps v7 `LanguageModelUsage` (total input + `inputTokenDetails.noCacheTokens/cacheReadTokens/cacheWriteTokens`) onto the Anthropic-shaped `TokenUsage` (`input_tokens` = non-cached) so `calculateCost` prices correctly; `logUsage` fires from `streamText.onEnd` on every request.
- **New `ASSISTANT_SYSTEM` prompt** — `CHAT_SYSTEM` is guide-scoped by design; the assistant prompt explicitly forbids fabricating personal data until issue 02's tools land.
- Thread ids are client-generated uuids validated with `z.uuid()` — avoids a response-header dance to communicate a server-created id; RLS + `user_id` scoping makes collision/hijack a non-issue.
- Suite: **376 passing** (query round-trip/isolation/ordering on PGlite, route contract tests with `ai` mocked at the module boundary, usage-mapper unit tests). Build green.
- **Issue 02 (tool use) shipped same session** — registry → AI SDK `tool()`s (userId closure, SDK-validated inputs, capped outputs), **hybrid search decision** (semantic `findSimilarChats` k=5 first, keyword fallback, deduped by chatId — semantic path costs one logged embedding call and degrades to []), settled tool parts persisted via `toStoredParts` (discriminated Zod), ToolChip citation UI (+ first `dom`-project test), prompt gains tool-routing + injection-resistance rules, OpenAI parallel stack deleted (`api/chat/general`, `assistant-tools-openai`, `ChatGeneralSchema`; `lib/ai/openai.ts` stays for embeddings). Suite: **372 passing** (OpenAI-stack tests deleted with it). Build green.
- **Issue 05 (thread management) shipped same session** — thread rail (desktop sidebar, collapsible list on mobile), `?thread=` URL-state routing (`new` = fresh; default = latest), `deleteThread` owner-scoped with FK-cascade + `deleteThreadAction` (7-step, new `chatThreadsLimiter` 60/min degrade-open, NOT_FOUND on foreign threads), client URL-sync after first reply. renameThread skipped (optional per issue); e2e spec deferred. Suite: **378 passing**; build green.
- **Issue 03 (native web search) shipped same session** — provider-executed `webSearch_20250305` (maxUses 3), `sendSources: true`, `source-url` parts persisted (+ `providerExecuted` flag round-trips), SourceList citation UI, per-search surcharge modeled (`WEB_SEARCH_PER_CALL_USD` → `logUsage.surchargeUsd`; the spend cap now sees search costs). Suite: **381 passing**; build green.
- **Issue 04 (firm data / "why JPM") shipped same session** — `get_firm` with fuzzy matching (slug → normalized name → initials 'JPM'/'GS' → substring; pure `matchFirm` unit-tested), firm-scoped `search_chat_logs` (extended rather than a new tool; semantic over-fetch k=10 then filter), firm-prep synthesis prompt with explicit source attribution + never-invent rule. Reused `lib/data/firms.ts` (domain's existing Supabase-client layer) instead of adding `lib/db/queries/firms.ts`. Deferred: e2e golden-path spec (with all other e2e), `firm_data` refresh pipeline (own unit per architecture.md). **Unit 9 is now fully shipped (01→05)**. Suite: **390 passing**; build green.
- **Unit 8 scoped + closed down to one open issue** — a code-vs-plan diff (`.scratch/unit-8-question-bank/SCOPING-2026-07-17.md`) found issues 01–05 were already shipped by Unit 11 under different shapes (no rubric column — key_points/misconceptions/model_answer; follow-ups are ordinal chains, not trees; fail-closed grading limiter is deliberate). The real gap was test debt: **50 new tests** backfilled over `lib/db/queries/qbank.ts`, the topic-mastery queries, and `serveQuestionAction`/`gradeAnswerAction`. Issue 06 (AI-generated questions) is triage-gated on Jake — filed. todo.md's shipped items struck; chat-onboarding brainstorm logged (`context/brainstorms/2026-07-17-chat-onboarding.md`). Session-final suite: **441 passing**.

## Prod-readiness relay session 5 — Phase 5: e2e real, chatbot hardening, spend-cap integrity (2026-07-18)

- **e2e is now actually runnable** — `playwright.config.ts` gained a `webServer` block
  (`pnpm build && pnpm start`; `reuseExistingServer` outside CI). Before this, CI's e2e job
  ran playwright against nothing and could never pass. Verified under CI's placeholder env:
  signed-out requests never contact Supabase (auth-js short-circuits without a session
  cookie), so placeholders are safe. Opt-in `PLAYWRIGHT_CHROMIUM_EXECUTABLE` for containers
  with pre-seeded browsers.
- **Auth storageState plumbing + the two deferred golden-path specs** — `global-setup.ts`
  signs in via the real /login form when `STREETPREP_E2E_AUTH=1` + creds are set (no-op
  otherwise); chatbot spec mocks `/api/chat/assistant` with a hand-built AI SDK v7
  UI-message SSE stream (format verified against the installed dist); question-bank spec
  stays on the AI-free serve path. Baseline: 1 passed / 10 skipped. CI secrets to ungate
  filed to jakes-tasks (optional).
- **LLM thread auto-titling** (last Unit 9 deferral) — haiku call in the assistant route's
  `onEnd` on first exchange only; sanitized plain text (never parsed as JSON); best-effort
  (failure keeps the truncation fallback); one `ai_usage` row (`chat/assistant/title`); no
  new route/limiter (runs inside the expensive-tier-gated request).
- **Spend-cap integrity, two real holes found by review and fixed**:
  (1) client disconnect mid-stream skipped `streamText.onEnd` (flush never runs on cancel)
  so the main sonnet call logged nothing while partial replies still persisted — aborting
  every request bypassed the monthly cap. Fixed with `void result.consumeStream({onError})`
  (SDK tees the base stream; drain guarantees the usage log), verified against ai@7.0.31
  dist. (2) Whisper transcription never logged usage at all — both transcribe routes now
  write one row per call (duration/60 × $0.006 via `surchargeUsd`; missing duration → $0
  row). The token-priced `whisper-1` PRICING entry was decorative and is gone.
- **`createThread` races tolerated** — `onConflictDoNothing` on the client-supplied uuid PK;
  cross-user collision verified safe (RLS + per-query user_id predicates: an attacker
  posting a victim's threadId can neither create nor mutate the victim's thread).
- **New-thread flicker fixed** (issue 06, filed + closed same session) — stable mount key
  via `ChatSession` wrapper + pure `computeNextChatSessionState`; first-send confirmation
  no longer remounts `AssistantChat`, so the streamed reply can't race the refresh read.
- **Consistency sweep from the second review** — structure-chat/draft-followup wrap the
  Anthropic call → 502 like siblings; resume-coach skips unknown weakness flags; dead
  'markets' mode removed from `INTERVIEW_MODES`.
- **Docs reconciled to reality** — architecture.md now says OpenAI
  `text-embedding-3-small` (what's actually shipped); Voyage switch is an open Jake
  decision. firm_data refresh pipeline brainstorm authored
  (`context/brainstorms/2026-07-18-firm-data-refresh.md`) with 4 product questions filed.
- Session-final suite: **465 passing**; typecheck/lint/build green throughout.

## Prod-readiness relay session 5 (continued) — third review sweep: learn/mastery (2026-07-18)

- **Gate-scoring integrity closed** — `finishSittingAction` now enforces a 6h sitting
  window and a minimum distinct-question count (canonical GATE_QUESTION_COUNT /
  SECTION_DRILL_COUNT moved to `lib/curriculum/chapters.ts`, clamped to the live pool for
  thin sections). Before: one easy graded question with `context: "chapter-gate"` passed
  the whole 8-question 85% gate. Residual (conscious): the served-question set isn't
  pinned — needs server-side sitting sessions if ever warranted.
- **Paper-LBO NaN eliminated** — leverage now rolls strictly below entryMultiple
  (the 6/6 overlap made equityIn 0 → MOIC/IRR NaN → unsolvable drill, ~1/24 of runs).
- **Reviewed clean in this sweep** (don't re-hunt without new evidence): mastery math
  (no div-by-zero/NaN, sane spaced-rep intervals), UTC streak math + empty states,
  onboarding cookie tradeoff (unsigned but self-scoped, documented), limiter policy
  (AI fail-closed, CRUD degrade-open, serve path correctly unlimited), applications
  ownership + RLS, curriculum flow empty-data paths, RLS coverage across all
  qbank/progress/applications tables. Earlier sweeps: chatbot subsystem (2 real findings,
  both fixed), interview/resume/relationships (1 invariant violation + 3 consistency
  gaps, all fixed). Session-final suite: **472 passing**.

## Prod-readiness relay session 7 — Phase 5: component coverage, UX sweep, SEO, ai_usage NOT NULL (2026-07-19)

- **Session-6 flake identified and fixed**: the "1 failure on first run after fresh
  install" was `tests/unit/lib/db/queries/chat.test.ts` timing out at vitest's 5s
  default while PGlite instantiates its WASM bundle on a cold filesystem cache
  (~6s observed). Node project now sets `testTimeout`/`hookTimeout` 15s (hooks hit
  the same wall under parallel load).
- **Component (dom) coverage 2 → 19 files**: 81 new tests across learn (answer
  card, drills, practice session gate pass/fail, qbank studio), relationships
  (forms, outreach drawer, optimistic mark-done/stage-change with revert,
  structure-notes round trip, streaming prep + 429), nav/markdown/profile/firms/
  marketing. Happy-dom gotchas documented in tests: Radix Tabs activate on
  mousedown, DropdownMenu on pointerdown; IntersectionObserver never fires (use a
  fake); `navigator.clipboard` needs defineProperty.
- **Fresh-eyes UX sweep → 10 findings, 9 fixed, 1 filed**
  (`.scratch/ux-polish/issues/01` reading-lens keyboard access): mock-interview
  `?mode=` links honored; daily-drill summary dead end got a Done link; dashboard
  weak-topic Drill deep-links `?topic=` with validation + preselect; new-contact
  form maps server fieldErrors to inline highlights; aria-describedby wired on all
  three RHF forms; outreach-drawer disabled-button hint; advanced-track label
  drift unified; firm-prep + contact-detail Regenerate no longer destroy prior
  content on failure; resume-coach Start-over keeps the uploaded text.
- **SEO baseline added**: `app/robots.ts` (disallow /api/ + authed routes),
  `app/sitemap.ts` (4 public pages), OpenGraph/Twitter metadata + `metadataBase`
  via new `lib/site.ts` (NEXT_PUBLIC_SITE_URL → VERCEL_URL → localhost). Jake:
  set `NEXT_PUBLIC_SITE_URL` in Vercel (filed). No og:image asset exists yet.
- **Deferred Low #16 closed**: `ai_usage.user_id` NOT NULL via migration 0011
  (deletes unattributable NULL orphans — they're invisible to every per-user
  spend-cap read, i.e. uncapped spend; guarded SET NOT NULL; idempotent).
  `logUsage` now warns + skips instead of inserting attribution-less rows.
  Enumerated all 14+ call sites: every production path supplies userId. Jake
  applies 0011 (filed).
- Gates at session end: typecheck ✅, lint 0 errors, suite **803 passing / 97
  files** (from 707/78), build exit 0, repo-wide prettier ✅.

## Prod-readiness relay session 7 (continued) — component coverage complete, reading-lens a11y, mobile fixes (2026-07-19)

- **Component coverage finished**: 49 more dom tests (mock-studio incl. full mocked
  record→transcribe→score flow + initialMode validation; resume-coach incl.
  start-over text preservation; firm-prep restore-on-failure + sentinel splitting;
  chat-panel; product-tour via a getBoundingClientRect stub — happy-dom has no
  layout engine; sidebar-profile-menu; google-button). Every non-shadcn component
  now has tests.
- **Reading-lens keyboard a11y shipped** (ux-polish issue 01 closed): debounced
  selectionchange path + managed focus on settle + Escape dismiss; 3 dom tests.
- **Mobile sweep → 8 findings, all fixed**: chapter-row control stacking,
  thread-rail options always visible + 36px below md, 36px touch targets on
  mark-done/delete, nudge-row stacking, resume preview sticky gated to lg,
  mock-interview rubric grid collapse below sm, progress heatmap 7-col wrap.
- Final gates: typecheck ✅, lint 0 errors, suite **855 passing / 105 files**,
  build exit 0, repo-wide prettier ✅.

## Prod-readiness relay session 8 — launch compliance: account deletion, legal pages, feedback widget, health probe (2026-07-20)

Worked the top AFK-safe items from `context/brainstorms/2026-07-19-launch-readiness.md`
as three parallel subagent slices (opus for the destructive flow, sonnet for the rest),
verified together, committed per-slice.

- **Self-serve account deletion** (`c3bc481`) — new `/profile/settings` route with a
  Danger Zone; confirm-twice dialog requires typing `DELETE`. `deleteAccountAction`:
  auth → `accountDeletionLimiter` (5/min, fail-open — a dead Redis must not trap a
  user in an account they want gone) → Storage cleanup (`resumes`/`mock-audio`/
  `mock-video` `{userId}/` prefixes; paginated list, chunked remove, missing-bucket
  tolerant, aborts BEFORE the auth delete on real faults) → `auth.admin.deleteUser`
  → local sign-out + `sp-onboarded` cookie cleared (re-signup re-runs onboarding) →
  redirect `/`. Cascade audit re-verified across migrations 0000–0012: every
  user-owned table references `auth.users(id) on delete cascade`, so no explicit row
  deletes. PostHog person-delete (promised in architecture.md) deferred with a TODO —
  analytics is still unwired. Notable: **no Storage upload code exists anywhere yet**
  (`.storage.from(` has zero call sites), so the buckets are likely unprovisioned —
  filed to jakes-tasks. 10 new tests (order-of-operations, abort-before-delete,
  dialog gating).
- **Privacy Policy + Terms + custom 404** (`8daf791`) — `/privacy` and `/terms`
  drafted from a code audit, not boilerplate: subprocessors verified against
  package.json + real env reads (Supabase, Anthropic, OpenAI, Upstash, Vercel,
  Sentry, PostHog-conditional; **Groq excluded — doc drift, see below**); honest AI
  disclosures; governing law left as a visible Jake placeholder. Linked from the
  marketing footer, signup page ("By signing up you agree…"), and sitemap.
  `app/not-found.tsx` matches `error.tsx`'s styling. 10 new tests.
- **Feedback widget + `/api/health`** (`d4819b6`) — floating dialog on every authed
  page → `submitFeedbackAction` (Zod, `feedbackLimiter` 5/min, withUser/Drizzle)
  into new `feedback` table (migration `0012_feedback.sql`, owner RLS, idempotent in
  0010's style; Drizzle schema + PGlite test schema mirrored). Health probe:
  GET-only `select 1` via `getDb()` with a 3s timeout, 200/503, no detail leaked,
  allowlisted through the `/api/*` auth backstop (`PUBLIC_API_ROUTES` in
  middleware) so external uptime monitors can reach it signed-out. 13 new tests.
- **Doc drift fixed in architecture.md**: speech-to-text is OpenAI `whisper-1` as
  built (both transcribe routes call `api.openai.com`; no Groq key exists in code or
  `.env.example`) — the Groq Whisper Turbo claim was never wired. Also updated the
  account-deletion paragraph to shipped reality.
- **Issues filed**: `.scratch/launch-readiness/issues/01-data-export.md`
  (portability; reuse deletion's enumeration) and `02-prompt-injection-review.md`
  (indirect-injection framing for assistant tool content; matters more once
  firm_data refresh ingests live web content).
- Final gates: typecheck ✅, lint 0 errors (2 pre-existing warnings), suite
  **888 passing / 113 files** (from 855/105), build exit 0, repo-wide prettier ✅.

## Prod-readiness relay session 8 (continued) — data export, injection framing, dead schema, page coverage (2026-07-20)

- **Self-serve data export** (`f214517`) — `GET /api/account/export` (legacy
  `requireUser` cheap tier + `withUser`/Drizzle) returns every user-owned row
  (18 tables) grouped by table as a JSON attachment; download button on
  `/profile/settings` above the Danger Zone. Embedding vectors excluded (noted
  in payload meta); no Storage objects exist yet to include. Closes
  launch-readiness issue 01. Known tradeoffs: cheap tier (30/min) not a
  dedicated 2/hour limiter; full JSON buffered in memory (fine at current
  per-user volumes).
- **Assistant prompt injection framing** (`79676d8`) — `ASSISTANT_SYSTEM` now
  explicitly frames tool + web_search results (firm descriptions, chat notes,
  search snippets) as untrusted DATA, never instructions; string-assertion
  regression test. Closes launch-readiness issue 02. Tool-result delimiter
  wrapping deliberately skipped (capText already bounds fields; reshaping tool
  results would ripple through tests/UI for marginal gain).
- **Dead schema deleted** (`4c48ad0`) — `lib/db/schema/resumes.ts` +
  `interview-sessions.ts` had no CREATE TABLE in any migration and zero call
  sites (surfaced by the export audit); deleted. No deletion-cascade blind
  spot — the tables never existed.
- **Page-level + reader coverage** (`c2c8cc3`) — 8 new page-test files
  targeting pages with real branching (dashboard flow, firm-detail notFound +
  mention-matching, applications `?stage=` validation, question-bank due-first
  dedup cap, onboarding redirect, learn gate/drill, dev-spend rollups) and
  extended markdown/reading-lens tests (TOC, explain streaming, beginner-mode
  per-section error isolation). Thin delegation-only pages skipped by design.
  Noted gap for a later session: `lib/curriculum/progress.ts` + `cycle.ts`
  pure logic has no dedicated unit tests (exercised only via page tests).
- Suite after this block: **931 passing / 122 files**.

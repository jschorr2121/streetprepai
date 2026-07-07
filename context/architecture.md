# Architecture Context

## Stack

| Layer                   | Technology                                                                  | Role                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework               | Next.js 16 (App Router) + TypeScript                                        | Server-rendered React app. Server Components for reads; Server Actions for mutations; Route Handlers for streaming endpoints and external webhooks. |
| UI                      | Tailwind CSS v4 + shadcn/ui (new-york) + Geist Sans/Mono + lucide-react     | Design system primitives, tokens, typography, icons.                                                                                                |
| Auth                    | Supabase Auth (email + Google OAuth)                                        | Sessions, password reset, OAuth. Every page and Server Action is gated behind a signed-in user.                                                     |
| Database                | Supabase Postgres + pgvector + Drizzle ORM                                  | Single source of truth. All user data, content metadata, mastery model state, and embeddings live here.                                             |
| Row-level security      | Supabase RLS policies                                                       | Per-row enforcement that a user can only read/write their own rows. Shared content (chapters, firms, sectors, public Q-bank) is read-only.          |
| Object storage          | Supabase Storage                                                            | Resume PDFs, mock-interview audio recordings, and HireVue practice video recordings. Per-user buckets/prefixes; access via signed URLs.             |
| Video capture           | Browser `MediaRecorder` API                                                 | Records HireVue practice answers as `.webm` directly in the browser; chunks uploaded to Supabase Storage after stop. No transcoding pipeline — native playback only. |
| LLM                     | Anthropic Claude (Opus / Sonnet / Haiku)                                    | All generative AI. Server-side only — API key never reaches the browser.                                                                            |
| AI SDK layer            | Vercel AI SDK for chatbot UI + `@anthropic-ai/sdk` for everything else      | `useChat` for the streaming tool-using chatbot; raw Anthropic SDK for explain, beginner mode, scoring, prep sheets, structuring (full control of prompt caching + tool use). |
| Web search (chatbot)    | Anthropic native `web_search` tool                                          | Chatbot's web tool. No separate vendor; pricing rolled into Claude calls.                                                                           |
| Embeddings              | Voyage AI `voyage-4-lite` (queries) / `voyage-4-large` (heavy docs)         | Semantic search across networking chats and content. Voyage 4 MoE means lite/large share a vector space — index once, query at any quality tier.    |
| Speech-to-text          | Groq Whisper Turbo                                                          | Voice mock interview transcription and post-event note dictation. Cheap, fast inference.                                                            |
| Resume parsing          | `pdf-parse` (text extraction) → Claude tool use (structured profile JSON)   | Two-stage: extract text from the PDF, then send to Claude for structured field extraction.                                                          |
| Background jobs         | Inngest                                                                     | Spaced re-surfacing of weak Q-bank items, weekly firm-data refresh, prep-sheet pre-generation, embedding backfills, follow-up reminders.            |
| Rate limiting           | Upstash Ratelimit + Upstash Redis                                           | Per-user, per-route sliding-window limits on AI endpoints. Non-optional given the LLM cost profile.                                                 |
| Calendar integration    | Google Calendar API + OAuth 2.0 (granular consent) directly                 | User connects Google Calendar; we sync coffee chats and interviews; webhook-driven event updates.                                                   |
| Email                   | Resend                                                                      | Transactional email (auth) + Relationship Manager follow-up sends. React Email for templates.                                                       |
| Analytics               | PostHog (cloud)                                                             | Product analytics, funnels, session replay, feature flags. Event-tracked from signup through chapter completion through mock-interview submission.  |
| Error + perf monitoring | Sentry                                                                      | Error tracking, performance traces, alerts.                                                                                                         |
| Testing                 | Vitest (unit) + Playwright (e2e on critical flows)                          | Vitest for pure logic (mastery math, prompt builders, scoring helpers). Playwright for signup → onboard, chapter → practice, chat → follow-up. LLM calls mocked. |
| CI/CD                   | GitHub Actions (typecheck + lint + tests on PRs) → Vercel preview deploys → manual promotion to production | Catches breakage before Vercel deploys. Preview URLs on every PR. Production promoted manually from the Vercel dashboard.                            |
| Hosting                 | Vercel                                                                      | Edge + serverless runtimes. Most routes are Node.js (Anthropic SDK, Drizzle).                                                                       |

**HireVue video note:** Phase 1 ships with the simplest possible video path — browser `MediaRecorder` records to `.webm`, uploaded raw to Supabase Storage, played back via signed URLs. No Mux, no Cloudflare Stream, no transcoding. If playback UX or mobile compatibility becomes a problem later, a Mux migration is straightforward (the recording flow doesn't change).

## System Boundaries

The codebase lives in `web/`. Routes are structured as **learning flow as the spine + tools layered on top**; `lib/` is organized domain-by-domain so each concern has one home.

### Routes (`web/app/`)

- `app/(marketing)/` — public marketing pages. No auth. No DB calls. No LLM calls.
- `app/(auth)/` — signup, login, password reset, OAuth callback. The only place anonymous traffic is allowed past `(marketing)`.
- `app/(app)/` — the signed-in shell. Sidebar + main. Every page here requires a valid session; redirects to `/login` otherwise.
  - `(app)/dashboard/` — recruiting cycle widget, today's prep sheets, top 3 weak areas, completion stats, streak.
  - `(app)/learn/[chapter]/[section]/` — the learning-flow spine. Reading + Reading Lens + interactive tutorials.
  - `(app)/learn/[chapter]/practice/` — AI-graded practice questions at chapter end.
  - `(app)/tools/chatbot/` — tool-using Claude chatbot.
  - `(app)/tools/story-framer/` — STAR story generation + Story Bank.
  - `(app)/tools/resume-coach/` — PDF upload + AI rewriting.
  - `(app)/tools/mock-interview/` — mock interview studio with two modes: **voice** (audio-only) and **HireVue** (video). Same scoring pipeline; only the capture surface differs.
  - `(app)/tools/question-bank/` — Technical Question Bank with difficulty, follow-up trees, spaced re-surfacing.
  - `(app)/tools/relationships/` — contacts list, calendar view, semantic search.
  - `(app)/tools/relationships/[id]/` — contact detail: prep sheet, log chat, history.
  - `(app)/firms/[slug]/` — firm page (earnings, deals, intel, 10–15 firm-specific Qs).
  - `(app)/sectors/[slug]/` — sector deep-dive page.
  - `(app)/profile/` — view/edit resume-populated profile.
  - `(app)/progress/` — mastery heatmap + completion stats + streak detail.
- `app/api/` — only for things that **cannot** be a Server Action: streaming endpoints and external webhooks. Mutations from the client go through Server Actions, never through API routes.
  - `api/chat/stream/` — SSE for the tool-using chatbot.
  - `api/lens/{explain,beginner}/` — SSE for Reading Lens.
  - `api/inngest/` — Inngest endpoint (background jobs entrypoint).
  - `api/webhooks/google-calendar/` — Google Calendar push notifications + OAuth callback.

### Library code (`web/lib/`)

Each folder owns one concern and exposes a stable public API via `index.ts`. Cross-folder imports are explicit; no folder imports React or UI code.

- `lib/ai/` — all LLM prompt builders, Claude SDK wrappers, tool definitions, model selection. **No** DB calls, **no** UI imports, **no** Next.js imports. The single home for "talk to Claude."
- `lib/auth/` — Supabase auth helpers, session retrieval, server-side user fetch, middleware. The single source of `getCurrentUser()` and `requireUser()`.
- `lib/db/` — Drizzle schema (`schema/`), typed queries (`queries/`), migrations (`migrations/`). **No** LLM calls, **no** UI imports. The only place SQL is written.
- `lib/inngest/` — Inngest client + all background job functions (spaced re-surfacing, weekly firm refresh, prep-sheet pre-gen, embedding backfills, follow-up reminders). May import `lib/ai`, `lib/db`, `lib/embeddings`. **Never** imported from a Server Action or page.
- `lib/embeddings/` — Voyage client, embedding generation, pgvector similarity search helpers. Imports `lib/db` for vector queries.
- `lib/speech/` — Groq Whisper Turbo client wrapper.
- `lib/calendar/` — Google Calendar OAuth flow + sync logic + webhook handlers' business logic.
- `lib/ratelimit/` — Upstash Ratelimit configurations per route. Exports named limiters consumed by Server Actions and API routes.
- `lib/email/` — Resend client + React Email templates.
- `lib/analytics/` — PostHog server-side wrapper; capture helpers callable from Server Actions.
- `lib/mastery/` — Bayesian mastery model math (pure functions). Reads from and writes to `lib/db`; no LLM or network.
- `lib/resume/` — PDF text extraction (`pdf-parse`) + Claude-driven structuring. Calls `lib/ai`, returns typed profile fragments.
- `lib/schemas/` — Zod schemas shared between Server Actions, API routes, and clients. The single source of truth for input/output shapes.

### Components (`web/components/`)

- `components/ui/` — shadcn primitives only. No business logic, no data fetching, no LLM calls.
- `components/app-nav.tsx` — global sidebar nav.
- `components/learn/` — chapter reader, Reading Lens, tutorial widgets, practice-question card.
- `components/tools/{chatbot,story-framer,resume-coach,mock-interview,question-bank,relationships}/` — per-tool client components. Each tool's UI is isolated from other tools.
- `components/firms/`, `components/sectors/`, `components/dashboard/` — surface-specific UI.
- `components/shared/` — cross-feature components (e.g. `<PrepSheet />` shared between Relationship Manager and Firm pages).

### Content (`web/content/`)

- `content/chapters/[chapter-slug]/[section-slug].md` — MDX for each chapter section. Frontmatter: title, description, order, tutorial type, practice question IDs.
- `content/firms/`, `content/sectors/` — static reference metadata (display names, logos, slugs). Dynamic firm data (earnings, deals, intel) lives in Postgres.

### Server Actions location

Server Actions live next to the routes that call them as `actions.ts`, **not** inside `lib/`. Server Actions are the "front door" to mutations; they call `lib/db`, `lib/ai`, `lib/embeddings`, etc. — they do not contain SQL or prompt text inline.

### Disallowed imports (boundary rules)

- `components/**` MUST NOT import from `lib/db`, `lib/ai`, `lib/inngest`, or any server-only module.
- `lib/**` MUST NOT import from `components/**` or `app/**`.
- `lib/db/**` MUST NOT import from `lib/ai/**` (and vice versa) — they are peers.
- `lib/inngest/**` is import-only by `app/api/inngest/route.ts` and other background-job files. Never imported by a page or Server Action.

## Storage Model

Four physical stores: **Postgres** (Supabase, with the `pgvector` extension), **Supabase Storage**, **Upstash Redis**, and **MDX files in the repo**. Postgres is the single source of truth for everything user-owned and everything queryable; the other stores are deliberately scoped.

### Postgres (Supabase)

The default. Every user-owned table has a `user_id` column with RLS scoping it to `auth.uid()`. Shared content tables (chapters, firms, sectors, public Q-bank) are read-only for users.

Table groups (representative, not exhaustive):

- **Users & profile** — `profiles` (school, grad_year, current_semester, target_firms[]), `experiences` (resume-derived), `resumes` (PDF metadata + Storage URL + parsed JSON).
- **Learning flow (content metadata)** — `chapters`, `sections`, `tutorials` (type: `inline` | `worked` | `socratic`, plus `content_json`), `practice_questions` (with difficulty + rubric), `practice_question_followups` (tree). The reading prose itself is **not** in Postgres — see MDX below.
- **Learning flow (user state)** — `chapter_progress`, `section_progress`, `user_practice_attempts` (per attempt: answer text, AI score, rubric breakdown, answered_at).
- **Mastery & engagement** — `topic_mastery` (Bayesian/weighted score per topic), `streaks`.
- **Story Bank** — `stories` (raw experience, tags, AI framings JSON).
- **Mock interviews** — `mock_sessions` (one row per sitting, with `mode`: `voice` | `hirevue`), `mock_turns` (one row per Q-A pair: question, answer transcript, **audio URL** *or* **video URL** depending on mode, adaptive follow-up chain, AI score JSON, ordinal), `mock_scorecards` (final session-level scorecard with rubric and model answer; video-mode scorecards include on-camera presence signals in addition to the standard content + delivery scores).
- **Technical Question Bank** — `qbank_questions` (shared content; topic, difficulty, prompt, rubric, source `curated`|`ai_generated`), `qbank_followups` (parent→child tree, 3–5 deeper probes), `qbank_attempts` (user, question, score, when), `qbank_spaced_state` (next-due timestamp, ease factor, history — drives spaced re-surfacing).
- **Relationship Manager** — `contacts`, `chats` (raw notes + structured JSON + `embedding vector(1024)`), `calendar_events` (linked to Google event IDs and optionally to contacts), `outreach` (drafts, sent_at, scheduled follow-ups), `prep_sheets` (target = person | firm, content JSON, generated_at, stale_after).
- **Firms & sectors (shared content)** — `firms`, `firm_data` (`kind`: earnings | deal | news | culture, content JSON, fetched_at — refreshed weekly by an Inngest job), `firm_interview_questions` (10–15 per firm), `sectors`.
- **Chatbot history** — `chat_threads`, `chat_messages` (role, content, tool calls, citations).
- **Observability & cost** — `llm_usage` (user, route, model, tokens in/out, cost USD, latency, created_at — used for cost dashboards and abuse alerting), `audit_log` (sensitive actions: resume uploads, Google Calendar connections, data exports).

### pgvector (inside Postgres)

Embedding columns sit on the tables that need them, not in a separate database:

- `chats.embedding` — semantic search over networking history ("who did I talk to about Apollo's culture?").
- `qbank_questions.embedding` — find similar questions for variety + duplicate detection.
- `firm_data.embedding` — chatbot retrieval over firm intel.

All embeddings produced by Voyage `voyage-4-lite` by default. The MoE architecture means we can re-query with `voyage-4-large` against the same vectors when quality matters.

### Supabase Storage

Object storage for files that Postgres shouldn't hold:

- `resumes/{user_id}/{resume_id}.pdf` — uploaded resume PDFs. **Persisted indefinitely** until user deletes.
- `mock-audio/{user_id}/{session_id}/{turn_id}.webm` — voice mock recordings. **Retained 30 days, then deleted by an Inngest cron job.** Transcripts (in `mock_turns.answer_transcript`) and scorecards are persisted forever — only the raw audio expires.
- `mock-video/{user_id}/{session_id}/{turn_id}.webm` — HireVue practice video recordings. **Retained 30 days, then deleted by the same Inngest cron job.** Same rule as audio: transcripts + scorecards stay forever; raw media expires.

Access is via short-lived signed URLs. RLS-aligned bucket policies enforce that a user can only access their own prefix.

### Upstash Redis

Transient, non-authoritative state only:

- Sliding-window rate-limit counters (`@upstash/ratelimit`).
- Optional short-TTL caches for expensive read-mostly queries (firm pages, dashboard widgets).

Nothing user-authoritative ever lives here.

### MDX files in the repo (`web/content/chapters/...`)

Reading-heavy prose for each chapter section. The `chapters`, `sections`, and `practice_questions` rows in Postgres reference an MDX file by slug; the file is the source of truth for the prose. Practice questions, tutorial definitions, and follow-up trees live in Postgres (so they can be queried by difficulty, AI-generated additions can be inserted, and spaced re-surfacing can run against them).

### What does NOT live in Postgres

- Raw chapter prose (lives in MDX, reviewable in PRs).
- Files larger than a few KB (lives in Supabase Storage).
- Rate-limit counters and transient caches (lives in Upstash).
- Vendor-side state — PostHog events, Sentry errors, Inngest run history, Resend send logs, Google Calendar event IDs are referenced by ID but not duplicated.

## Auth and Access Model

### Authentication

- Every signed-in surface (`app/(app)/**`, `app/api/**` except webhooks) requires a valid Supabase Auth session. Anonymous access is allowed only on `app/(marketing)/**` and `app/(auth)/**`.
- Sign-in methods: **email + password** and **Google OAuth**. Both flow through Supabase Auth.
- Sessions are stored in HTTP-only cookies by `@supabase/ssr`. Server Components and Server Actions read the user via `lib/auth.requireUser()`, which throws/redirects on missing session.
- Anthropic, Voyage, Groq, and other LLM API keys live in environment variables and are accessed only by server code in `lib/ai`, `lib/embeddings`, `lib/speech`. They never reach the browser.
- A Next.js middleware refreshes the Supabase session cookie on every request to `(app)` routes.

### Roles

Two roles, encoded as a custom claim on the Supabase JWT:

- **`user`** — the default. Read/write their own user-owned rows. Read-only access to shared content (chapters, sections, tutorials, practice_questions, qbank_questions, firms, firm_data, firm_interview_questions, sectors).
- **`admin`** — a small set of accounts (the founder and future content editors). Same as `user` plus write access to shared content tables and ability to trigger Inngest jobs (firm refresh, embedding backfills) from an internal admin page.

A user becomes `admin` by an explicit row in an `admins` table; the role is mirrored into the JWT via a Supabase auth hook. There is no public path to becoming admin.

### Ownership

- Every user-owned row carries a `user_id` (FK to `auth.users.id`). A user owns exactly their own rows; there is no team or sharing model in phase 1.
- Shared content (chapters, sections, tutorials, practice_questions, qbank_questions, firms, firm_data, firm_interview_questions, sectors) has no owner — it's global, read-only to users, write-only to admins.
- Generated artifacts (mock recordings, prep sheets, story framings, scorecards, chat threads) are owned by the user whose action produced them.

### Access control

- **Postgres RLS** is the enforcement layer. Every user-owned table has policies of the shape:

  ```
  USING ( user_id = auth.uid() )
  WITH CHECK ( user_id = auth.uid() )
  ```

  Reads, inserts, updates, and deletes are all gated by RLS. The application never reads or writes user data with the service-role key in user-facing paths — only with the user's session.

- **Server Actions** also call `requireUser()` and pass the session-scoped Drizzle client. Defense in depth: even if a policy is missing, the action checks auth.

- **Service-role key** is used only by background jobs (`lib/inngest/**`), webhook handlers, and admin operations. It bypasses RLS. Code paths that use the service-role key are explicit (must import `serviceRoleClient` from `lib/db`), making them easy to audit.

- **Supabase Storage policies** mirror DB RLS: a user can read/write only under their own prefix (`resumes/{user_id}/...`, `mock-audio/{user_id}/...`). All access is via short-lived signed URLs minted server-side.

- **Rate limiting** runs in front of LLM-calling Server Actions and Route Handlers, keyed by `user_id` with per-route tiers.

### Onboarding

- After signup, the user is taken to an onboarding flow that requires: school, grad year, current semester, and target firms (minimum 1).
- Resume upload is offered prominently in onboarding but is **optional**. Tools that depend on resume data (Resume Coach, experience-driven Story Framer suggestions) prompt the user to upload when accessed without one. The cycle widget, dashboard, and chatbot work from the manually-entered profile fields alone.
- The onboarding completion flag is `profiles.onboarded_at`. Middleware redirects to `/onboarding` if it's null.

### Account deletion + data export

- **Self-serve account deletion is supported in phase 1.** A "Delete my account" action in `/profile/settings` cascades through every user-owned table and Storage prefix, deletes the PostHog person, and removes the Supabase Auth user. Deletion is irreversible and immediate.
- **Data export is not in phase 1.** Users requesting an export email support; the export is produced manually until a self-serve flow is added.

## Invariants

Rules the codebase must never violate. Each is enforceable and reviewable in a diff.

1. **All LLM, embedding, and speech-to-text calls happen server-side.** The Anthropic, Voyage, and Groq API keys live in environment variables and are touched only by code in `lib/ai`, `lib/embeddings`, `lib/speech`, and modules they call. Client components never import these keys or these modules.
2. **No free-form JSON parsing from LLM output.** Any time we need structured data from Claude (resume parsing, chat structuring, scorecards, story framings, prep sheets), we use Claude **tool use** with a typed Zod-validated schema. Never `JSON.parse` of a model's text response.
3. **Every user-owned table has RLS scoped to `auth.uid()` via `USING` and `WITH CHECK`.** User-facing paths read and write Postgres through a session-scoped Drizzle client, not the service-role key. The service-role key is used only inside `lib/inngest/**`, webhook handlers, and explicit admin operations.
4. **Every LLM call writes one `llm_usage` row** (user_id, route, model, input tokens, output tokens, cost USD, latency ms, status). This is the cost-control backbone — never bypass it, even in scripts.
5. **Every AI-calling Server Action or Route Handler is wrapped by an Upstash sliding-window rate limiter, keyed by user_id.** Free path is the unlimited-cost path; rate limits are not optional.
6. **Mutations from the client go through Server Actions, not Route Handlers.** `app/api/**` exists only for: (a) streaming endpoints (Claude SSE for chatbot and Reading Lens), (b) external webhooks (Google Calendar, Inngest entrypoint, Resend), (c) the health check. Anything else is a Server Action.
7. **Prompt caching is enabled on system blocks for any prompt with >1K tokens of stable content** (chapter context, firm data, profile blob, persona). `cache_control: { type: "ephemeral" }` is the default for these; non-cached prompts must be a deliberate choice.
8. **Background work runs in Inngest, not in request handlers.** No `setTimeout`, no detached `Promise.then`, no in-process queues in Route Handlers or Server Actions. If a task can outlive the request, it is an Inngest function.
9. **Folder boundaries are enforced.** `components/**` does not import from `lib/db`, `lib/ai`, `lib/inngest`, `lib/email`, or any server-only module. `lib/**` does not import from `components/**` or `app/**`. `lib/db` and `lib/ai` are peers — neither imports the other. ESLint rules + import-paths review enforce this.
10. **Postgres is the source of truth for everything user-authoritative.** Upstash Redis holds only rate-limit counters and transient caches. Vendor systems (PostHog, Sentry, Inngest, Resend, Google Calendar) are referenced by external ID but never the system of record for our own data.

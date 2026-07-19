# Jake's Tasks

Things **Jake** has to do by hand (dashboard config, secrets, account
settings, third-party setup, manual verification) that run *concurrently*
with Claude's code changes. Claude appends to this file whenever a change
needs action it can't perform itself.

> Convention: each item notes **why** it's needed, **where** to do it, and the
> **unit** it unblocks. Move finished items to the bottom under "Done".

---

## 🔴 Needed now (blocks the current unit from working end-to-end)

- [ ] **Apply migration `0010_chat_threads.sql`** (relay session 4, 2026-07-17) — the new
  `/tools/chatbot` (Unit 9 issue 01) reads/writes `chat_threads` + `chat_messages`; the
  page 500s in prod until this runs. Idempotent — paste into the Supabase SQL editor
  (same manual flow as 0009). Owner RLS on both tables; after applying, spot-check that
  a second account can't read another user's thread.

- [ ] **Recreate the `design/ui-overhaul` git worktree in `~/Developer/InterviewPrep`** —
  the repo moved out of iCloud (see Done below) but that worktree still lives at the old
  `~/Documents/InterviewPrep/.claude/worktrees/ui-overhaul` path, since git won't let the
  same branch be checked out in two worktrees at once. Now that `design/ui-overhaul` is
  merged into `master` (see Done below), this worktree is likely no longer needed at all —
  just delete `~/Documents/InterviewPrep` once you've confirmed `~/Developer/InterviewPrep`
  has everything. One uncommitted local-only change was dropped in the move
  (`.gstack/browse-audit.jsonl`, a QA log, saved to
  `/private/tmp/.../scratchpad/browse-audit.diff` — low value, safe to lose).

> Reminder: when you deploy, make sure the **new Upstash creds + the Supabase
> auth settings are also set in Vercel project env**, not just `web/.env.local`.

---

## 🟠 Upcoming units (do before that unit starts, not blocking today)

- [ ] **Unit 8 issue 06 triage (AI-generated qbank questions)** (relay session 4,
  2026-07-17) — Unit 8 issues 01–05 turned out to be already shipped by Unit 11 (see
  `.scratch/unit-8-question-bank/SCOPING-2026-07-17.md`); issue 06 is the only one left
  and needs three product calls before an agent builds it: (a) is it still worth
  building at all now that the bank has 532 curated questions (40–71 per gated
  technical chapter)? (b) if yes: generated questions global-shared
  (`source='ai_generated'`, service-role insert, admin review later — recommended) or
  per-user private? (c) quality gate: single generation call few-shot on curated
  questions of the same topic/difficulty (recommended) vs. generate-then-self-check
  (2x cost). Drop the answers in the issue file or here.

- [ ] **Product call: chat-driven onboarding?** (relay session 4, 2026-07-17) — your
  todo.md item "onboarding as an ai chat kinda flow that fills in for you" is now cheap
  to build (Unit 9 shipped all the ingredients). Sketch + the 3 decisions you'd need to
  make are in `context/brainstorms/2026-07-17-chat-onboarding.md`. Say go/no-go and the
  relay can build it in one session.

- [ ] **Product call: firm_data refresh pipeline** (relay session 5, 2026-07-18) —
  decision-ready brainstorm in `context/brainstorms/2026-07-18-firm-data-refresh.md`
  (weekly Inngest cron + Anthropic web_search synthesis, ~$3–5/mo at 21 firms). Four
  questions need your answers before an agent builds it: (a) firm roster — full ~21
  target list or start with the 3 seeded (GS/Evercore/MS)? (b) is weekly freshness a
  real SLA (needs alerting) or soft target? (c) cost cap/alert wanted? (d) confirm
  compliance posture: web_search + LLM synthesis only, never republishing news-API
  content verbatim. Answer here or in the brainstorm file.

- [ ] **Confirm friend permissions for personal prep materials** (curriculum content
  authoring — see `context/curriculum.md` §7) — get an OK from Maddy Kozower, Max
  Ellis, and Zachary Ufberg before shipping any content derived from their personal
  binders/notes/highlights (frameworks, drill patterns, and prioritization signals
  only; their prose is rewritten regardless). Why: their docs are design inputs to
  the curriculum; the commercial BIWS/M&I PDFs in `extra_content/` are structure-only
  references and their text is never ingested.

- [ ] **Google Cloud setup for Calendar sync** (Unit 10, issue 01) — in the Google
  Cloud console: enable the **Google Calendar API**, configure the OAuth consent
  screen (External + add yourself as a test user while unverified), create an
  **OAuth 2.0 Web client** with redirect URI
  `http://localhost:3000/api/auth/google-calendar/callback` (+ the Vercel URLs later).
  Put `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`,
  `GOOGLE_CALENDAR_REDIRECT_URI` in `web/.env.local` (+ Vercel env). Note: this is a
  **separate OAuth client** from the Supabase sign-in one — Calendar uses direct
  OAuth with the `calendar.readonly` scope. Why: Unit 10 cannot exchange tokens
  without it.
- [ ] **Generate `GOOGLE_TOKEN_ENC_KEY`** (Unit 10, issue 01) — 32 random bytes,
  base64 (`openssl rand -base64 32`), into `web/.env.local` + Vercel. Why: refresh
  tokens are encrypted at rest with this key.
- [ ] **Create an Inngest account/app** (Unit 10, issue 04 — also unblocks future
  background jobs) — sign up at inngest.com, create the app, set
  `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` in `web/.env.local` + Vercel. Why:
  webhook-driven calendar sync and the channel-renewal cron run as Inngest functions.
- [ ] **Apply migrations 0006–0009 as their units land** (Units 8–10) — same manual
  SQL-editor flow as 0004/0005 if the DB is unreachable from the dev environment.
- [ ] **Apply migration `0009_perf_indexes_2.sql`** (prod-readiness relay, 2026-07-16) —
  idempotent; adds two covering indexes (`chats(user_id, contact_id, happened_at desc)`,
  `applied_jobs(user_id, stage, added_at desc)`), drops ten single-column indexes that
  are strict prefixes of existing composites (pure write-cost savings, read plans
  unchanged), and re-creates `match_chat_embeddings` with `SET ivfflat.probes = 10` so
  semantic chat recall stops running at the default single-probe (which can silently
  miss matches for per-user filtered searches). Same SQL-editor flow as 0004/0005.

- [ ] **Apply migration `0011_ai_usage_user_id_not_null.sql`** (prod-readiness relay,
  2026-07-19) — security-review Low #16: makes `ai_usage.user_id` NOT NULL so a usage row
  can never be un-attributed (a NULL owner is invisible to the per-user monthly spend cap in
  `lib/ai/usage.ts::assertUnderQuota`, which filters `user_id = :uid`). Idempotent +
  live-data-aware: it first DELETEs any existing NULL rows (unattributable orphans from the
  pre-sweep / old lazy-thenable era — no recoverable owner, and per-user reads already
  exclude them, so no real user's total drops) then runs a guarded `ALTER ... SET NOT NULL`.
  Same manual SQL-editor flow as 0009/0010. The `DO` block RAISEs a NOTICE with the count of
  orphan rows removed — note it if non-zero (that spend was never captured by any user's cap).

- [ ] **Verify the production `firms` table is seeded** (prod-readiness relay, 2026-07-16) —
  `/firms`, `/firms/[slug]`, and the firm-prep route now read the `firms` table exclusively
  (the hardcoded seed arrays were deleted when the pages were wired to real data). Local dev
  gets rows via `supabase db reset` → `web/supabase/seed.sql`; production only has them if
  that insert was ever run there. Check `select count(*) from firms;` — if 0, run the firms
  section of `web/supabase/seed.sql` in the SQL editor (idempotent, `on conflict do nothing`).

## 🟡 Before launch (not blocking dev, but don't ship without it)

- [ ] **Four quick dashboard checks from the launch-readiness brainstorm** (prod-readiness
  relay, 2026-07-19 — details + sources in `context/brainstorms/2026-07-19-launch-readiness.md`):
  (a) **Supabase plan/backup posture** — the project was found paused on 2026-07-12, which
  suggests Free tier (auto-pauses after ~a week idle, no point-in-time recovery); confirm
  the plan and backup story before real users exist. (b) **Google OAuth consent screen:
  publish it if still in Testing** — Testing mode hard-caps sign-ins at 100 users with
  7-day token expiry (this is the sign-in OAuth client, separate from the Unit-10 Calendar
  one). (c) **Vercel plan + Spend Management** — confirm limits/alerts so a traffic spike
  can't run up a surprise bill. (d) **Click through the password-reset email flow live
  once** — it's never been verified end-to-end in prod.

- [ ] **Set `NEXT_PUBLIC_SITE_URL` in Vercel env (Production + Preview)** (prod-readiness
  relay, 2026-07-19) — the relay added robots.txt, sitemap.xml, and OpenGraph/Twitter
  metadata (`web/lib/site.ts` centralizes the site URL). Without this var the code falls
  back to `VERCEL_URL` (the per-deployment `*.vercel.app` URL), so canonical/OG URLs and
  the sitemap would point at the wrong host in production. Set it to the real domain,
  e.g. `https://<your-domain>`. Documented in `web/.env.example`. Also note: no OG image
  exists yet — if you want link previews with an image, drop a 1200×630 asset in and the
  relay can wire it.

- [ ] **Re-enable "Confirm email" in Supabase** before production so real
  signups must verify their address (lowers spam/abuse). (Unit 4)
- [ ] **Set Sentry build env vars in Vercel** — `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
  `SENTRY_PROJECT` (Sentry → Settings → Auth Tokens, needs `project:releases` +
  `org:read`). The build plugin is now wired (`web/next.config.ts`) and is a no-op
  until these exist; with them, production builds upload + strip source maps so
  Sentry stack traces are readable. Also confirm `NEXT_PUBLIC_SENTRY_DSN` /
  `SENTRY_DSN` are set. (prod-readiness relay, 2026-07-15)
- [ ] **Verify the new security headers on the first preview deploy** — the relay
  added CSP/HSTS/X-Frame-Options/etc. in `web/next.config.ts`. Open the deployed
  preview with devtools console and click through the app (esp. PostHog-enabled
  pages and anything Supabase Storage serves); any CSP violation shows up as a
  console error naming the blocked origin. If you use the EU PostHog region, set
  `NEXT_PUBLIC_POSTHOG_HOST` in Vercel env — the CSP derives its allowed origins
  from env at build time. (prod-readiness relay, 2026-07-15)
- [ ] **Decide the monthly per-user AI spend cap** — the relay wired
  `assertUnderQuota` into every AI route; default is **$20/user/month**, override
  with `AI_USER_MONTHLY_CAP_USD` in Vercel env (`<=0` disables). Sanity-check the
  default against expected usage/pricing. (prod-readiness relay, 2026-07-15)
  *Update 2026-07-18 (session 6): the cap now also gates `gradeAnswerAction` (the
  only AI-calling Server Action), and an opus pricing bug was fixed — interview
  scoring/resume critique had been logged at 3x their real cost, so historical
  `ai_usage` totals overstate opus spend; the $20 default now stretches ~3x
  further on those features than the old data suggests.*

- [ ] **Product call: cheaper transcription model?** (prod-readiness relay,
  2026-07-18) — swapping OpenAI `whisper-1` ($0.006/min) for
  `gpt-4o-mini-transcribe` ($0.003/min) halves transcription cost with a
  one-line model change in the two transcribe routes. Gated on you because the
  interview flow derives delivery metrics (WPM, filler words, pauses) from the
  transcript's timestamped words, and transcript style/timestamps can differ
  between models — worth a quick A/B on one of your own recordings before
  switching. Details + sources in
  `context/brainstorms/2026-07-18-ai-cost-optimization.md`. Say go/no-go.
- [ ] **(Optional) Give CI a real login to run the authed Playwright specs** — as of
  2026-07-18 `web/tests/e2e/global-setup.ts` signs in once via the real `/login`
  form and saves a `storageState` (cookies + localStorage) that every authed spec
  (`chatbot.spec.ts`, `question-bank.spec.ts`, `profile.spec.ts`,
  `applications.spec.ts`, `interview.spec.ts`, `resume.spec.ts`, the authed half of
  `chat.spec.ts`) now consumes via `test.use({ storageState: AUTH_STORAGE_STATE_PATH })`.
  It only runs when **`STREETPREP_E2E_AUTH=1`** AND **`STREETPREP_E2E_EMAIL`** /
  **`STREETPREP_E2E_PASSWORD`** are all set — absent today in both local dev and
  `.github/workflows/ci.yml`, so these specs stay SKIPPED everywhere right now (by
  design — this is not blocking). To actually exercise them in CI: (1) create a
  standing test account in the real (or a staging) Supabase project — onboarded,
  with "Confirm email" off or already-confirmed for that account; (2) add
  `STREETPREP_E2E_EMAIL` / `STREETPREP_E2E_PASSWORD` as GitHub Actions repo/env
  secrets; (3) set `STREETPREP_E2E_AUTH=1` in the `e2e` job's env in
  `.github/workflows/ci.yml` alongside the existing placeholder envs (this repo's
  CI workflow was intentionally left untouched by this change — see CHANGES.md).
  The chatbot spec mocks the LLM via `page.route` so it's free to run in CI; the
  question-bank spec only serves questions (a DB read), never grades (no AI call),
  so it's also free. `resume.spec.ts` / `chat.spec.ts`'s authed describe blocks are
  separately gated behind `STREETPREP_E2E_LIVE_AI` and hit real Anthropic — do not
  enable those in CI without also accepting the per-run cost. (prod-readiness relay,
  session 5, 2026-07-18)

---

## ✅ Done

- [x] **Regenerate `web/.env.example`** — done by the prod-readiness relay (2026-07-16):
  regenerated from the vars actually read in code (audited every `process.env.*` reference)
  and now tracked in git (`web/.gitignore` gained a `!.env.example` exception). Skim it once
  to sanity-check the required-vs-optional annotations against your Vercel env.

- [x] **Unpushed history squashed + repo fully repaired** (2026-07-07) — the 12
  unpushed master commits were squashed into `15a4866` on origin's `1a06923`
  (tree identical to the old tip), `design/ui-overhaul` rebased on top, both
  branches pushed to GitHub. Broken `archive/ink-design` tag and a superseded
  May-19 stash deleted (Jake approved); `git gc` + `git fsck --full` pass clean.

- [x] **Migrations 0004 + 0005 applied** — confirmed live 2026-06-13 via direct
  DB connection: `profiles.current_semester` + `onboarded_at` present;
  `applied_jobs.stage` CHECK is the canonical 6-value set. (Note: `0005` is not
  re-runnable — Claude is fixing its idempotency, finding R4.)
- [x] **RLS on `applied_jobs` + `profiles` verified** — live 2026-06-13 with two
  real users: 7/7 isolation checks pass (no cross-user read/update/delete/insert).
  `applied_jobs_owner` and `profiles_owner` policies confirmed working.
- [x] **Upstash Redis recreated + rate limiting verified live** (2026-06-13, R1) —
  new store `dashing-seasnail-122992.upstash.io` is wired into `web/.env.local`,
  `/ping` returns PONG, and a sliding-window test denied past the limit (5 allow,
  3 deny). Throttling is now active. (Still set the same creds in Vercel env for prod.)
- [x] **Disable "Confirm email" in Supabase** (dev) — done by Jake.
- [x] **Configure Google OAuth** (Supabase provider + Google Cloud redirect URI) — done by Jake.
- [x] **Set Auth URL configuration** (Site URL + Redirect URLs) — done by Jake.
- [x] **Fix Vercel Root Directory → `web`** — done by Jake in the dashboard. Also required
  deploying via CLI from the repo root (not from inside `web/`) since a CLI deploy run from
  `web/` double-applies the project's Root Directory setting and can't find `app/`.
- [x] **Supabase project reachable again** — confirmed live 2026-07-12 via `supabase db query
  --linked` (no longer paused, or was resumed already).
- [x] **Migrations 0006 + 0007 applied** — confirmed live 2026-07-12: `qbank_questions` = 532
  rows, `qbank_followups` = 1,199 rows. Applied via `supabase db query --linked -f
  supabase/migrations/0007_qbank_seed.sql` (the Supabase dashboard SQL editor rejected 0007 as
  too large to paste).
- [x] **Move the repo out of iCloud** — now at `~/Developer/InterviewPrep` (was
  `~/Documents/InterviewPrep`, iCloud-synced). `pnpm install` + `pnpm typecheck` both ran clean
  with zero `ETIMEDOUT` errors, confirming iCloud eviction was the root cause. The old copy is
  still at `~/Documents/InterviewPrep` — delete it once you've confirmed everything works from
  the new location (also recreates the `ui-overhaul` worktree, see 🔴 above).
- [x] **Run the verification gates from a LOCAL checkout** — `pnpm typecheck` ran clean after
  fixing 3 real type errors it caught (dashboard weak-topics lookup, question-bank topic
  filter, onboarding `advancedTrack` zod default) — commit `18dabe3`. These were silently
  failing every production build even after the Root Directory fix; production is now green.

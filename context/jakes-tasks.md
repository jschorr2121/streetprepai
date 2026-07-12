# Jake's Tasks

Things **Jake** has to do by hand (dashboard config, secrets, account
settings, third-party setup, manual verification) that run *concurrently*
with Claude's code changes. Claude appends to this file whenever a change
needs action it can't perform itself.

> Convention: each item notes **why** it's needed, **where** to do it, and the
> **unit** it unblocks. Move finished items to the bottom under "Done".

---

## 🔴 Needed now (blocks the current unit from working end-to-end)

- [ ] **Apply migrations `0006_curriculum.sql` + `0007_qbank_seed.sql`** (Unit 11 —
  curriculum/Question Bank) — creates the qbank/progress/mastery tables + `profiles.advanced_track`,
  then seeds **532 questions + 1,199 follow-ups**. Without this the learn gates, section drills,
  and Question Bank return "no questions available." Apply via the Supabase dashboard SQL editor
  or `pnpm db:migrate` from an environment with DB access (remote instance was unreachable /
  paused from this dev box). Regenerate the seed anytime with `node scripts/build-qbank-seed.mjs`.
- [ ] **Run the verification gates from a LOCAL (non-iCloud) checkout** (Unit 11) — `pnpm typecheck`,
  `pnpm lint`, `pnpm test`, `pnpm build` could **not** be run in this session: the repo lives in
  `~/Documents` (iCloud) and every toolchain invocation died with `ETIMEDOUT` reading `node_modules`
  (files evicted by iCloud — the known issue in project memory). The code was statically checked
  (all imports/exports resolve; the `"use server"` export pattern mirrors the Unit 6 canonical
  action that builds), but a real tsc/lint/test/build pass is still owed. **Fix: move the repo out
  of iCloud** (e.g. `~/dev/InterviewPrep`) so the toolchain stops timing out — this keeps recurring.

> Reminder: when you deploy, make sure the **new Upstash creds + the Supabase
> auth settings are also set in Vercel project env**, not just `web/.env.local`.

---

## 🟠 Upcoming units (do before that unit starts, not blocking today)

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

## 🟡 Before launch (not blocking dev, but don't ship without it)

- [ ] **Re-enable "Confirm email" in Supabase** before production so real
  signups must verify their address (lowers spam/abuse). (Unit 4)

---

## ✅ Done

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

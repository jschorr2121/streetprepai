# Jake's Tasks

Things **Jake** has to do by hand (dashboard config, secrets, account
settings, third-party setup, manual verification) that run *concurrently*
with Claude's code changes. Claude appends to this file whenever a change
needs action it can't perform itself.

> Convention: each item notes **why** it's needed, **where** to do it, and the
> **unit** it unblocks. Move finished items to the bottom under "Done".

---

## 🔴 Needed now (blocks the current unit from working end-to-end)

- [ ] **Recreate the `design/ui-overhaul` git worktree in `~/Developer/InterviewPrep`** —
  the repo moved out of iCloud (see Done below) but that worktree still lives at the old
  `~/Documents/InterviewPrep/.claude/worktrees/ui-overhaul` path, since git won't let the
  same branch be checked out in two worktrees at once. Now that `design/ui-overhaul` is
  merged into `master` (see Done below), this worktree is likely no longer needed at all —
  just delete `~/Documents/InterviewPrep` once you've confirmed `~/Developer/InterviewPrep`
  has everything. One uncommitted local-only change was dropped in the move
  (`.gstack/browse-audit.jsonl`, a QA log, saved to
  `/private/tmp/.../scratchpad/browse-audit.diff` — low value, safe to lose).
- [ ] **Regenerate `web/.env.example`** — it was an unrecoverable dead iCloud placeholder
  (not tracked by git — `web/.gitignore`'s `.env*` pattern also catches the example file) and
  was dropped during the move. Not blocking (it's just a template), but worth recreating from
  the vars actually read across `lib/env.ts` / server actions so new setups have something to
  copy from.

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

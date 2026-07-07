# Jake's Tasks

Things **Jake** has to do by hand (dashboard config, secrets, account
settings, third-party setup, manual verification) that run *concurrently*
with Claude's code changes. Claude appends to this file whenever a change
needs action it can't perform itself.

> Convention: each item notes **why** it's needed, **where** to do it, and the
> **unit** it unblocks. Move finished items to the bottom under "Done".

---

## 🔴 Needed now (blocks the current unit from working end-to-end)

- [ ] **Unpause/restore the Supabase project** — `gmtmcdcwtilcsninbsvt.supabase.co`
  no longer resolves in DNS (Supabase pauses free-tier projects after ~1 week
  idle; paused projects lose their DNS). Every auth/DB call fails with "fetch
  failed", so signup/login are dead in dev and the UI revamp's authenticated
  visual QA is blocked. Fix in the Supabase dashboard (Restore project). If the
  project is gone, create a new one and update `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`,
  `DIRECT_URL` in `web/.env.local` (then re-copy it into
  `.claude/worktrees/ui-overhaul/web/.env.local`). After that, ask Claude to
  rerun the authenticated screenshot QA pass. (UI revamp session, 2026-07-07)
  - Note: the worktree's `.env.local` also had the OLD deleted Upstash host;
    already re-synced from the main checkout on 2026-07-07.

> Reminder: when you deploy, make sure the **new Upstash creds + the Supabase
> auth settings are also set in Vercel project env**, not just `web/.env.local`.

---

## 🟠 Repo health (decide soon — blocks pushing to GitHub)

- [ ] **Decide how to squash unpushed history** — ~13 git objects inside the 12
  unpushed master commits were permanently destroyed by iCloud eviction (repaired
  enough to work day-to-day on 2026-07-06, but `git push` and `git gc` will fail
  until the unpushed range is squashed into one commit on top of origin's
  `1a06923`). Claude can do the squash — just say go; granularity of those 12
  commit messages is what gets lost. (UI revamp session)
- [ ] **Move the repo out of iCloud-synced `~/Documents`** (or turn off macOS
  "Optimize Mac Storage") so evicted-file corruption can't recur. Suggested:
  `~/dev/InterviewPrep`. (UI revamp session)

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

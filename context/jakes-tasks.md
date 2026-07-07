# Jake's Tasks

Things **Jake** has to do by hand (dashboard config, secrets, account
settings, third-party setup, manual verification) that run *concurrently*
with Claude's code changes. Claude appends to this file whenever a change
needs action it can't perform itself.

> Convention: each item notes **why** it's needed, **where** to do it, and the
> **unit** it unblocks. Move finished items to the bottom under "Done".

---

## 🔴 Needed now (blocks the current unit from working end-to-end)

_Nothing blocking right now — all current items resolved (see Done below)._

> Reminder: when you deploy, make sure the **new Upstash creds + the Supabase
> auth settings are also set in Vercel project env**, not just `web/.env.local`.

---

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

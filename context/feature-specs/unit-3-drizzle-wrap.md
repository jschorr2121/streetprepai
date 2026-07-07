# Unit 3 — Drizzle wrap (read-only proof)

> Status: Complete (implemented 2026-06-02)
> Last updated: 2026-06-02
> Owner: Jake
>
> **Implementation note:** introspection uses a custom postgres.js generator
> (`scripts/introspect.mjs`, wired to `pnpm db:pull`) instead of `drizzle-kit
> pull`, which hangs against this project's Supabase pooler. RLS uses the
> `withUser(token, fn)` wrapper in `lib/db/client.ts` (option 3 below). Full
> rationale and verification in `context/CHANGES.md` → "Unit 3 — Drizzle wrap".

## User-visible behavior

None. Establishes the typed data-access pattern used by every subsequent unit.

## Acceptance criteria

- [ ] `lib/db/client.ts` exports a singleton Drizzle client connected to Supabase Postgres.
- [ ] `lib/db/schema/` contains Drizzle table definitions for **at least** `profiles` (the one we migrate in this unit) and ideally every existing user-owned table, introspected from the live database.
- [ ] A new file `lib/db/queries/profile.ts` exports `getProfile(db, userId)` using Drizzle.
- [ ] At least one calling site (`app/api/profile/save/route.ts` *read* path, or a Server Component) is migrated to import from `lib/db/queries/profile` instead of `lib/data/profile`.
- [ ] The legacy `lib/data/profile.ts` still exists and still works — both code paths coexist. No big-bang switch.
- [ ] The introspected schema is committed and matches the live DB exactly (regenerating it produces no diff).
- [ ] Verification gates green (typecheck + lint + build).

## Out of scope

- **No migration of any other domain** — contacts, chats, calendar, firms, etc. stay on raw Supabase queries until their own future units.
- **No write-side migration** — only the read path of `getProfile` is migrated. The write paths (save, extract-resume) still go through the existing Route Handlers + raw Supabase. Write migration happens unit-by-unit.
- **No new tables created** — we introspect what's already there, not invent new schema.
- **No RLS changes.** We trust the existing Supabase RLS policies. If a policy is missing on an introspected table, log it in the spec's Open Questions but don't fix it here.
- **No Inngest wiring** even though `inngest` is now installed. Unit 9+.
- **No removal of `lib/data/*.ts` raw-Supabase queries.** They get retired as their domains migrate in future units.

## Data model changes

None at the *database* level. We're describing existing tables in Drizzle's TypeScript DSL.

Schema files added (assumed names, refine on introspection):

```
lib/db/schema/
  index.ts            # re-exports all tables
  profiles.ts
  contacts.ts
  chats.ts
  calendar.ts
  firms.ts
  applied-jobs.ts     # may or may not exist post-Unit-1 cleanup; skip if dropped
  ...
```

## Surfaces affected

| Path | Change |
|---|---|
| `web/drizzle.config.ts` | New — points drizzle-kit at the Supabase DB |
| `web/lib/db/client.ts` | New — singleton Drizzle client (postgres.js driver) |
| `web/lib/db/schema/index.ts` | New — barrel re-exports |
| `web/lib/db/schema/profiles.ts` | New — introspected table definition |
| `web/lib/db/schema/<other tables>.ts` | New (if we introspect everything) |
| `web/lib/db/queries/profile.ts` | New — `getProfile(db, userId)` |
| One existing call site that reads profile | Modify — switch to new import |
| `package.json` scripts | Modify — add `db:introspect`, `db:generate`, `db:push` scripts |
| `.env.example` | Modify — add `DATABASE_URL` reference if not already added in Unit 2 |

## AI prompts and tool definitions

N/A.

## Edge cases

- **`DATABASE_URL` shape for Supabase:** must use the **pooler URL** (port 6543) for serverless compatibility, not the direct URL (port 5432). Direct URL is fine for migrations from a developer machine.
- **Connection in serverless:** the `postgres` client must be created with `{ prepare: false, max: 1 }` (or similar) to avoid prepared-statement issues with PgBouncer's transaction pooling.
- **RLS in queries:** Drizzle uses a service-role connection by default; that bypasses RLS. For user-facing queries we either need to use the Supabase JS client's session-scoped Postgres connection, or set `request.jwt.claims` on each transaction. **Open question — see below.**
- **Generated migrations:** if introspection produces SQL we don't want (extra indexes from Supabase Studio, etc.), we accept the introspected schema as ground truth; manual diffs go in a follow-up migration.
- **Profile row not found:** existing `getProfile` returns an `emptyProfile(userId)`. The Drizzle version must preserve that behavior so callers don't break.
- **Snake_case ↔ camelCase mapping:** Drizzle schema declares column names (snake_case) but lets you alias to camelCase in the TS type. Verify the alias style matches what existing code expects.

## Dependencies on other units

- Unit 2 (deps) — needs `drizzle-orm`, `drizzle-kit`, `postgres` installed.

## Verification and test plan

- **Demo path:**
  1. Open the profile page (`/profile` or wherever read-profile is wired).
  2. Confirm profile data renders identically before and after the migrated call site.
  3. Run `pnpm db:introspect` (or `drizzle-kit pull`); confirm no schema diff.
- **Tests:**
  - Vitest unit: `getProfile` returns the empty-profile shape when no row exists.
  - Vitest unit: `getProfile` maps snake_case columns to camelCase fields correctly (use a fixture).
  - No Playwright test required for this unit — read-only refactor.
- **Verification gates:** typecheck + lint + build pass; the single migrated call site renders the same UI as before.

## Open questions

- **RLS strategy for Drizzle:** the chosen approach must enforce `auth.uid()` scoping. Three options:
  1. Pass the user's JWT and run `set request.jwt.claims = ...` at the start of every transaction. Standard for Supabase + Drizzle.
  2. Continue using Supabase JS for user-scoped reads; use Drizzle only for service-role / background-job code. Cleaner separation but two query layers.
  3. Hybrid: Drizzle for everything, but a wrapper `userDb(userId)` that sets the claim transparently.
  
  **Recommendation:** option 3, implemented as `function getUserDb(supabaseJwt: string)` returning a Drizzle client with the claim set. Decide before introspection.

- **Introspect everything or just `profiles`?** Introspecting all tables now means future units don't repeat work. Cost is a longer first PR. **Recommendation:** introspect everything; migrate only one query in this unit. Schema files are cheap to add and won't break anything until imported.

- **Existing Supabase RLS policies** — are they complete on every user-owned table? Worth checking via `select * from pg_policies` and listing any gaps as a separate Unit (call it Unit 3.5 or fold into Unit 4).

## References

- Storage Model: `architecture.md` §Storage Model
- Code-standards data-access rules: `code-standards.md` §Data Access
- progress-tracker.md Unit 3 entry
- Open question on introspect-vs-schema-first: `progress-tracker.md` Open Questions

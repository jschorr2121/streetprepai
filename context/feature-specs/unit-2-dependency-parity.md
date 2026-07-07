# Unit 2 — Dependency parity

> Status: Draft
> Last updated: 2026-05-19
> Owner: Jake

## User-visible behavior

None. This is a tooling unit. The packages it installs unblock Units 3+.

## Acceptance criteria

- [ ] All required packages from the architecture stack are listed in `web/package.json`.
- [ ] `pnpm install` completes with no peer-dep warnings (or each warning has a documented reason in this spec).
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` all still pass — no code uses the new packages yet, so they shouldn't affect any existing check.
- [ ] An updated `.env.example` exists at the repo root (or `web/.env.example`) documenting which env vars each new vendor will need when the unit using it lands.

## Out of scope

- **No code changes that use the new packages.** First usage is Unit 3 (Drizzle wrap) and later.
- **No removal of `openai` yet** — it's still used by the current `lib/ai/embeddings.ts` and `app/api/whisper/transcribe`. Removal happens in Unit 10 (embeddings migration) and Unit 11 (Whisper migration).
- **No `voyageai-js` install** — Voyage will be a small fetch-based wrapper in `lib/embeddings/voyage.ts` when Unit 3 needs it. No SDK install required.
- **No real env-var values committed** — only `.env.example` placeholders.
- **No migration files generated** — `drizzle-kit` is installed but not yet pointed at the database. That's Unit 3.

## Data model changes

None.

## Surfaces affected

| Path | Change |
|---|---|
| `web/package.json` | Modify — add deps + devDeps |
| `web/pnpm-lock.yaml` | Modify — auto-generated |
| `web/.env.example` (or root `.env.example`) | New or modify — placeholder keys |

## Packages to install

### Production dependencies

| Package | Purpose |
|---|---|
| `drizzle-orm` | ORM layer on top of Supabase Postgres |
| `drizzle-zod` | Auto-derive Zod schemas from Drizzle tables |
| `postgres` | Postgres driver Drizzle uses for Supabase (vs `pg`) |
| `inngest` | Background job framework |
| `groq-sdk` | Groq Whisper Turbo client |
| `googleapis` | Google Calendar OAuth + sync |
| `resend` | Transactional email |
| `@react-email/components` | React Email template primitives |
| `react-hook-form` | Form library (`code-standards.md` §React) |
| `@hookform/resolvers` | Zod resolver for react-hook-form |
| `date-fns` | Date manipulation (`code-standards.md` §Dates) |
| `ai` | Vercel AI SDK (chatbot `useChat`) |
| `@ai-sdk/anthropic` | Anthropic provider for the AI SDK |

### Dev dependencies

| Package | Purpose |
|---|---|
| `drizzle-kit` | Schema introspection + migration generation CLI |
| `react-email` | CLI for previewing email templates locally |

## Environment variables (documented, not yet active)

Updated `.env.example` to include keys that will be needed in later units:

| Var | Used in unit | Vendor |
|---|---|---|
| `DATABASE_URL` | Unit 3 | Postgres direct connection (Supabase pooler URL) |
| `INNGEST_EVENT_KEY` | Unit 9+ | Inngest |
| `INNGEST_SIGNING_KEY` | Unit 9+ | Inngest |
| `GROQ_API_KEY` | Unit 11 | Groq |
| `VOYAGE_API_KEY` | Unit 10 | Voyage AI |
| `GOOGLE_CLIENT_ID` | Unit 9 | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Unit 9 | Google OAuth |
| `GOOGLE_REDIRECT_URI` | Unit 9 | Google OAuth |
| `RESEND_API_KEY` | Unit 19 | Resend |

Already present (do not duplicate):

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `SENTRY_DSN`
- Upstash + PostHog keys

## AI prompts and tool definitions

N/A.

## Edge cases

- **Peer-dep conflicts:** `react-hook-form` + `@hookform/resolvers` must match the already-installed Zod major version. Verify before install.
- **`postgres` vs `pg`:** Drizzle supports both. We pick `postgres` (postgres.js) because it's the standard for Supabase + serverless + edge.
- **`ai` SDK + `@ai-sdk/anthropic` version drift:** install both at the same time; verify they share a compatible API.
- **`drizzle-kit` is a devDependency** — make sure it isn't bundled into production.
- **`react-email` is a devDependency** — the CLI only; runtime template rendering uses `@react-email/components`.

## Dependencies on other units

None. Unit 2 is the second foundation unit; Unit 1 (cleanup) must be complete (✅).

## Verification and test plan

- **Demo path:** none (tooling unit).
- **Verification gates:**
  - `pnpm install` clean
  - `pnpm typecheck` clean
  - `pnpm lint` 0 errors
  - `pnpm build` succeeds
  - `package.json` deps visually correct (no duplicates, no overly broad version ranges)
  - `.env.example` updated and committed

## Open questions

- **Postgres driver:** `postgres` (postgres.js) is the recommended pick. Confirm before install — if there's a reason to prefer `pg` (for some serverless edge case), surface it now.
- **AI SDK version pinning:** `ai@^4` vs `ai@^5`. As of May 2026 the latest stable should be fine, but the API surface differs between majors. Spec-level decision: use latest stable; pin in `package.json` to the major (`^x.0.0`).

## References

- Architecture stack table: `architecture.md` §Stack
- Code-standards forms rule: `code-standards.md` §React (forms)
- Code-standards dates rule: `code-standards.md` §Dates
- progress-tracker.md Unit 2 entry

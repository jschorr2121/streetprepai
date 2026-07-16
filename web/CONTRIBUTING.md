# Contributing to Street Prep AI

Welcome. This is a Next.js 15 + Supabase + Claude app. All app code lives in `web/`.

## Local setup

```bash
cd web
pnpm install
pnpm dev   # http://localhost:3000
```

### Environment variables

`web/.env.local` is a symlink to `../env.local` at the repo root. Required keys:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...    # server-only, never exposed
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...               # Whisper for mock interviews
```

Production secrets live in Vercel project settings — do not commit them.

## Test pyramid

| Command              | What it runs                                                        | Cost                          |
| -------------------- | ------------------------------------------------------------------- | ----------------------------- |
| `pnpm test:unit`     | Vitest unit specs (pure functions, prompt builders, utils)          | $0                            |
| `pnpm test:int`      | Vitest integration specs (route handlers w/ MSW + mocked Claude)    | $0                            |
| `pnpm test:e2e`      | Playwright E2E — `STREETPREP_E2E_LIVE_AI`-flagged specs are skipped | $0                            |
| `pnpm test:e2e:live` | Playwright E2E with real Claude + OpenAI calls                      | **Costs money** — opt-in only |
| `pnpm test:coverage` | Coverage report from unit + int                                     | $0                            |

**E2E live-AI gate:** specs that hit real Anthropic/OpenAI APIs check `process.env.STREETPREP_E2E_LIVE_AI === "1"` and skip otherwise. CI runs `test:e2e` (skipped) — never `test:e2e:live`. Run live tests locally before shipping anything that materially changes a prompt or model call.

## API route checklist

Before merging a new or modified route under `app/api/**/route.ts`:

- [ ] **Auth-gated.** Use the Supabase server client and 401 if no user.
- [ ] **Zod-validated.** Parse request body with a Zod schema; reject on failure with 400.
- [ ] **User text sanitized.** Any user-supplied string that lands in a Claude prompt goes through `wrapUserText` (or equivalent) to neutralize injection.
- [ ] **Rate-limit tier picked.** Decide cheap/medium/expensive bucket — AI calls are always expensive.
- [ ] **Prompt cache configured.** System block uses `cache_control: { type: "ephemeral" }` if it carries reusable context.
- [ ] **No client-side API keys.** All `@anthropic-ai/sdk` and `openai` imports are server-only.

## Adding a Supabase migration

1. Create a new SQL file in `web/supabase/migrations/<timestamp>_<name>.sql`.
2. Apply locally: `pnpm supabase db push` (or via Supabase Studio).
3. Update any affected types: `pnpm supabase gen types typescript`.
4. Note any RLS policy changes in the PR description — reviewers will check them carefully.

## Format and lint

- Prettier runs via `pnpm format` (write) and `pnpm format:check` (CI).
- ESLint runs via `pnpm lint`.
- TypeScript strict mode: `pnpm typecheck`.
- Pre-commit hook (Husky + lint-staged) auto-formats staged files. Don't bypass with `--no-verify` unless a hook is genuinely broken.

## How CI gates a PR

Every PR runs `.github/workflows/ci.yml`:

1. `format:check` — Prettier
2. `lint` — ESLint
3. `typecheck` — `tsc --noEmit`
4. `test:unit` — Vitest unit
5. `test:int` — Vitest integration
6. `build` — `next build` with placeholder envs
7. `e2e` — Playwright (STREETPREP_E2E_LIVE_AI specs skipped)

All must pass before merge. Vercel deploys on merge to `master` via its GitHub integration — no extra release workflow.

## Style

- Use the existing component primitives in `components/ui/` (shadcn) before reaching for new deps.
- Server components by default; mark `"use client"` only when needed (interactivity, browser APIs).
- AI calls live in route handlers, never in client components.
- Streaming endpoints use `anthropic.messages.stream()` + `TextEncoder` — see `app/api/lens/explain/route.ts` for the canonical pattern.

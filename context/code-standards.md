# Code Standards

## General

- **One concern per file.** A file should have one obvious reason to exist. Mixing the page route, the data fetch, the AI prompt, and the email send in one file is the smell that should trigger a split.
- **Fix root causes, never workarounds.** If a type assertion (`as`) hides a real bug, fix the underlying type. If a try/catch swallows an error, ask why the error happened. The escape hatch is rarely the right answer.
- **No premature abstraction.** Three similar lines beat a generic helper. Wait for a fourth use before extracting. No `<T extends ...>` generic helpers for two callers.
- **No dead code, no half-finished implementations.** If a feature is partial, finish it or remove it. Don't ship `// TODO: handle the case where...` in shared utilities.
- **No speculative features.** Don't add flags, params, or branches "in case we need it later." Build what's required by the current task; revisit when the second caller actually shows up.
- **Match the scope of the task.** A bug fix doesn't need a refactor. A new feature doesn't need to rewrite the surrounding folder. Keep diffs reviewable.

## TypeScript

- **Strict mode + three extras enabled in `tsconfig.json`:**
  - `"strict": true`
  - `"noUncheckedIndexedAccess": true` — array index access returns `T | undefined`; you must check.
  - `"exactOptionalPropertyTypes": true` — `foo?: string` means `string`, not `string | undefined`.
  - `"noPropertyAccessFromIndexSignature": true` — must use bracket syntax for index-signature properties.
- **`any` is banned.** Use `unknown` for genuinely unknown input (parse it before use); `never` for impossible cases; a real type for everything else. Vendor libraries that ship `any` get a narrow wrapper that types them.
- **No `as` assertions on internal data.** If you reach for `as`, write the proper type guard or schema parse instead. The only acceptable `as` use is for assertions about external/unknowable shape that has already been validated.
- **Parse, don't validate, at boundaries.** Every external input (Server Action input, Route Handler body, webhook payload, env var, LLM tool-use output) is parsed by a Zod schema and only the parsed type flows into business logic. Anything that comes back from `JSON.parse` is `unknown` until parsed.
- **Branded types for IDs.** `type UserId = string & { readonly __brand: 'UserId' }`. Prevents accidentally passing a `chatId` where a `userId` is expected. Define brands in `lib/schemas/ids.ts`.
- **Prefer `type` over `interface`** except when extending a third-party library's interface. Consistency over the marginal differences.

## Next.js

- **Server Components by default.** Add `"use client"` only when the component needs interactivity, hooks (`useState`, `useEffect`), or browser APIs. The most useful question is: "does this need to ship JavaScript to the browser?"
- **Composition rule.** Server Components can render Client Components. Client Components cannot import Server Components — pass them as children/slots instead.
- **Server Actions for mutations.** Use Server Actions for every form submission and click-driven mutation (save story, log chat, score answer). Route Handlers exist only for streaming endpoints, external webhooks, and the health check. Mutations never go through `fetch('/api/...')`.
- **Server Action shape — discriminated union.** Every action returns:
  ```ts
  type ActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string> } };
  ```
  Callers branch on `result.ok`. Errors carry codes (`UNAUTHORIZED`, `VALIDATION_FAILED`, `RATE_LIMITED`, `NOT_FOUND`, `INTERNAL`) and human-readable messages. `fieldErrors` is populated for form validation failures.
- **Every Server Action follows this skeleton:**
  1. `requireUser()` — auth check.
  2. Zod parse of input — typed result or `VALIDATION_FAILED`.
  3. Rate-limit check — keyed by `userId` for AI actions.
  4. Ownership check — confirm the user owns the resource they're acting on (RLS is the safety net, not the only check).
  5. The actual work, wrapped in try/catch.
  6. Logging (`logger.info({ userId, action }, '...')`) on success; Sentry capture on unexpected error.
  7. Return `{ ok: true, data }` or `{ ok: false, error }`.
- **Colocated Zod schemas.** A Server Action's input schema lives in the same file as the action: `saveStorySchema` next to `saveStory`. If a client form needs the schema for hint validation, extract it to a sibling `schemas.ts` only at that point.
- **Route Handlers are focused.** One handler does one thing: stream chatbot tokens, accept a Google Calendar webhook, etc. Long branches (`if (action === 'a') ... else if (action === 'b') ...`) inside a Route Handler are a sign to split the route.
- **No `'use server'` files in `components/`.** Server Actions live next to the route that uses them (e.g. `app/(app)/tools/story-framer/actions.ts`) or in `lib/<domain>/actions.ts` for shared actions.
- **`/web/AGENTS.md` overrides.** This Next.js version has breaking changes vs. training-data defaults; read `node_modules/next/dist/docs/` before relying on remembered APIs.

## React (Client Components)

- **State strategy:**
  - `useState` for component-local state.
  - URL query params (`useSearchParams` / Next.js Link) for **shareable** state — filters, tabs, current chapter section, dialog open state on routes where deep-linking matters.
  - Server Components for **data** that doesn't change client-side.
  - Lift state to a parent before reaching for a global store.
  - **No Zustand, Jotai, Redux, or React Context for state** until a concrete cross-component need shows up. If/when one appears, add Zustand for that single case.
- **Forms via `react-hook-form` + Zod resolver** when the form has more than three inputs. Smaller forms can use plain `useState`. The form's Zod schema is the same one the Server Action parses on the server (single source of truth).
- **No `useEffect` for data fetching.** Use Server Components or Server Actions. The remaining valid `useEffect` use cases: subscribing to browser APIs, integrating non-React code, focusing inputs on mount. Each one is a code smell to verify before adding.
- **Components are functions, not classes.** No `class` components anywhere.
- **Hooks order:** State first, derived/memoized values second, effects last. Keep custom hooks in `components/<feature>/hooks/` or `lib/<domain>/hooks.ts`.

## Styling

- **Tailwind utility classes** for everything. No CSS modules, no styled-components, no emotion.
- **Tokens, not hex.** Use `bg-primary`, `text-foreground`, `border-border` — never `bg-emerald-700`, never `#047857`, never `border-zinc-200`. The token list is in `ui-context.md`. If you need a color that isn't a token, add the token first.
- **Radius scale from ui-context.md.** `rounded-md` for buttons and small UI, `rounded-lg` for cards, `rounded-xl` for hero/modal surfaces, `rounded-full` for pills/avatars. Don't pick arbitrary radii.
- **No inline `style={{}}`** unless the value is dynamic (e.g. a CSS variable for a progress bar width). Inline styles bypass token enforcement.
- **`cn()` helper for conditional classes.** `cn('base', isActive && 'active', variant === 'primary' && 'primary-styles')` — never string-concat class names manually.
- **shadcn primitives are edited, not wrapped.** If `<Button>` needs a new variant, edit `components/ui/button.tsx`. Do not create `<MyButton>`.

## Server Actions and Route Handlers

- **Validation:** every external input parsed by Zod before the function does anything else.
- **Auth:** `requireUser()` at the top of every action/handler that touches user data. Webhooks validate signing secrets.
- **Ownership:** explicit check that the user owns the target resource. RLS is the safety net, not the only enforcement.
- **Rate limiting:** every AI-calling action is wrapped in an Upstash limiter keyed by `userId`. Non-AI mutations can skip rate limiting unless they're cheap-to-spam (e.g. signup attempts).
- **Response shape:** discriminated union for actions; standard JSON `{ data | error }` for Route Handlers; SSE byte stream for streaming endpoints.
- **No leaking server-only error details.** `error.message` returned to the client is safe to display ("Daily mock interview limit reached"); raw stack traces and internal IDs stay in Sentry.

## Data Access

- **Drizzle queries live in `lib/db/queries/<domain>.ts`.** One file per domain (`contacts.ts`, `practice-questions.ts`, `mock-sessions.ts`, etc.). Each file exports named functions: `getContactById`, `listContactsForUser`, `createContact`. **No** class-based repositories or DI containers.
- **Functions take `(db, ...args)` explicitly.** This makes transactions trivial — pass a transaction client into the same function. No global Drizzle client captured in module scope (one shared client lives in `lib/db/client.ts`, but query functions accept it as a parameter).
- **Transactions for multi-step mutations** that must atomically succeed or fail (e.g. "log chat + create embedding + create follow-up reminder"). Wrap with `db.transaction(async (tx) => { ... })`. No external HTTP calls inside the transaction body.
- **Indexes on every foreign key + every column used in a `WHERE` or `ORDER BY`.** Declared in the Drizzle schema file. PRs that add a new query should add the index in the same diff.
- **Migrations** are generated by Drizzle Kit (`drizzle-kit generate`) and committed to `lib/db/migrations/`. Never edit a generated migration; create a new one to fix mistakes.
- **No raw SQL** in Server Actions or components. Raw SQL is allowed only inside `lib/db/queries/` files (and even there, prefer Drizzle's typed query builder; `sql\`\`` only when the builder can't express what you need).
- **No mocking the database in tests.** Tests that need a DB run against a real Postgres (or PGlite for unit-speed cases). Mocking Drizzle gives false confidence.

## Storage

- **User-authoritative data → Postgres.** With RLS scoping. No exceptions.
- **Files larger than a few KB → Supabase Storage.** Resumes, mock-interview audio, HireVue videos. Database stores the URL/path; the bytes live in Storage.
- **Embeddings → pgvector columns inside Postgres**, on the row they describe.
- **Transient state → Upstash Redis.** Rate-limit counters; short-TTL caches. Never the source of truth.
- **Reference data from vendors (PostHog event IDs, Sentry issue IDs, Google Calendar event IDs, Resend message IDs) → stored as opaque strings in Postgres.** Never duplicated.

## Naming

- **Files:** `kebab-case.tsx`. E.g. `practice-question-card.tsx`, `mock-session-recorder.tsx`.
- **Folders:** `kebab-case`. Route segments follow Next.js convention as-is (`learn/[chapter]/[section]`).
- **React components:** `PascalCase`. Named export inside the kebab-case file: `export function PracticeQuestionCard() {}`.
- **Hooks:** `useCamelCase`, in a file named `use-camel-case.ts`.
- **Functions and variables:** `camelCase`.
- **Constants:** `SCREAMING_SNAKE_CASE` only for true compile-time constants (env keys, magic numbers). Configuration objects stay `camelCase`.
- **Types:** `PascalCase`. Branded IDs: `UserId`, `ContactId`, `ChapterId`. Discriminated-union members: `ActionResult<T>` (not `IActionResult`, no `I` prefix).
- **Zod schemas:** `camelCaseSchema` (e.g. `saveStorySchema`); the inferred type is the same name without `Schema` (`SaveStoryInput`).
- **Database tables:** `snake_case` plurals (`practice_questions`, `mock_sessions`). Columns: `snake_case`. Drizzle's `pgTable` definitions live in `lib/db/schema/`.

## Exports and Imports

- **Named exports throughout.** `export function Foo()`, not `export default function Foo()`.
- **Default exports only where Next.js requires them:** `page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx`, `template.tsx`, `route.ts` handlers, middleware, and the Inngest function handler.
- **Path alias `@/` for everything.** `import { db } from '@/lib/db'`, not `../../../lib/db`. Same-file relative is `./` (e.g. `import { saveStorySchema } from './schemas'`).
- **No circular imports.** If you hit one, the right fix is to extract the shared piece, not to add a dynamic import.
- **Import order (auto-sorted by Prettier):** built-ins, third-party, `@/` aliases, relative — separated by blank lines.

## Comments

- **Light. Comment the non-obvious WHY, plus brief orientation comments at the top of substantial sections of code.** A good comment explains a constraint that isn't visible in the code (e.g. "Google Calendar's webhook expires after 7 days; we re-subscribe here") or orients a future reader on what a substantial block does (e.g. "// Adaptive follow-up tree: walks the question's followup chain in DFS order, stopping when the user answers a node correctly twice in a row.").
- **Never explain WHAT the code does line-by-line** — well-named identifiers handle that.
- **No `// added for the Y flow` or `// used by X`** — those belong in the PR description and rot fast.
- **No JSDoc on every function.** Reserve JSDoc for exported types and functions where the type itself doesn't capture intent (e.g. unit semantics: `/** Returns mastery score in [0, 1]; -1 means insufficient data */`).
- **Section orientation comments are encouraged for non-trivial blocks** — a single line at the top of a 30+ line section that summarizes what it does, especially in `lib/ai/` prompt builders, `lib/mastery/` math, and Inngest functions.

## Error Handling

- **Custom error hierarchy in `lib/errors.ts`:**
  - `AppError` (base, abstract)
  - `ValidationError` — Zod failed; carries `fieldErrors`.
  - `UnauthorizedError` — no session, expired, or wrong user.
  - `NotFoundError` — resource doesn't exist or isn't yours.
  - `RateLimitedError` — limit hit; carries `retryAfter` seconds.
  - `LLMError` — Claude / Voyage / Groq call failed (timeout, 5xx, content policy).
  - `ExternalServiceError` — Google Calendar / Resend / Inngest call failed.
- **Server Actions translate AppError → discriminated-union failure shape** in their top-level try/catch. Unknown errors get captured to Sentry and returned as `{ code: 'INTERNAL', message: 'Something went wrong.' }`.
- **Never swallow errors.** Empty `catch {}` blocks are forbidden. If an error is intentionally ignored, comment why (e.g. "Sentry capture is best-effort; we don't want to fail the parent operation").
- **Errors that surface to users are safe:** the `.message` shown in the UI is reviewed for leakage of internal IDs, file paths, stack traces.

## Logging

- **`pino` structured logger.** One shared instance in `lib/logger.ts`. Every log call passes a structured context object: `logger.info({ userId, action: 'mock_session_started', sessionId }, 'mock_session_started')`. Message strings are stable (queryable); context carries the variable data.
- **Standard fields:** every log line carries `userId` (or `'anon'`), `action` (a stable snake_case verb), and a relevant resource ID.
- **Log levels:**
  - `error` — captured to Sentry; something went wrong.
  - `warn` — unexpected but recoverable (rate limit hit, retry triggered).
  - `info` — significant business events (user signed up, mock session completed, prep sheet generated).
  - `debug` — local-dev only; never enabled in production.
- **No `console.log` in committed code.** ESLint blocks it. Use `logger.debug` or remove.
- **Sensitive data redaction.** `pino`'s `redact` config strips known sensitive keys (`password`, `token`, `apiKey`, `email` in some contexts). Don't log full LLM outputs (PII risk); log token counts and first 80 chars max.

## Dates and Times

- **Storage:** Postgres `timestamp with time zone`. Always UTC server-side.
- **Wire format:** ISO 8601 strings in API responses and Server Action payloads.
- **Client manipulation:** native `Date` plus `date-fns` (tree-shakeable, one function per import). Format with `date-fns/format`; arithmetic with `date-fns/addDays` etc.
- **User-facing display:** always in the user's local timezone, never UTC. The user's locale comes from the browser (`Intl.DateTimeFormat`).
- **Mutation is forbidden.** Never call `Date.prototype.setX(...)` — always create a new instance. `date-fns` is immutable by design; respect it.
- **No moment.js, no luxon, no day.js.** One date library across the project.

## Testing

- **Vitest** for unit tests. Pure-function tests live next to the file: `mastery.ts` + `mastery.test.ts`.
- **Playwright** for end-to-end tests on critical flows: signup → onboarding, complete a chapter section, log a chat → draft a follow-up, take a mock interview.
- **LLM calls are mocked in tests.** No real Claude/Voyage/Groq calls in CI. Fixture responses live in `tests/fixtures/`.
- **Real database in integration tests.** PGlite or a Postgres test container. No mocking Drizzle.
- **No tests for trivial code** (getters, pure pass-throughs). Test the math (mastery model), the prompt builders (correct shape, redaction), the parsing (Zod schemas reject bad input), the critical e2e paths. Coverage is not a target — meaningful tests are.
- **Test names describe the behavior:** `'returns INSUFFICIENT_DATA when the user has answered fewer than 3 questions in a topic'`, not `'test 1'`.

## Performance

- **Server Components stream by default.** Don't await every async value at the top; let layouts shell render while data fetches resolve.
- **`use cache` or `cacheTag` for read-mostly Server Component data** (firm pages, sector pages, chapter metadata). User-specific data is not cached.
- **`Image` from `next/image`** for every image. No raw `<img>` tags except for SVG inline icons (which we don't have — Lucide handles that).
- **Bundle vigilance.** Adding a dependency over ~30kb requires justification in the PR. Check the bundle analyzer (`@next/bundle-analyzer`) before merging anything that pulls in a new heavy library.

## Linting and Formatting

- **ESLint** with the Next.js recommended config + `eslint-plugin-import` (for import order) + `eslint-plugin-jsx-a11y` (for accessibility). Custom rules enforced:
  - No `console.log` (use `logger`).
  - No default exports outside Next.js conventions.
  - No imports of server-only modules from `components/**`.
  - No `any`.
- **Prettier** with project defaults: single quotes, 100-col line length, trailing commas, semicolons. Run on save.
- **Both run on every PR via GitHub Actions.** Failing lint blocks merge.

## File Organization

Recapitulated from `architecture.md` System Boundaries — the binding rules:

- `app/` — routes only. `page.tsx`, `layout.tsx`, `route.ts`, `actions.ts`. Server Components by default.
- `components/ui/` — shadcn primitives.
- `components/<feature>/` — feature-specific components.
- `lib/ai/` — Claude wrappers, prompt builders, tool definitions.
- `lib/auth/` — Supabase auth helpers.
- `lib/db/` — Drizzle schema, queries (one per domain), migrations.
- `lib/inngest/` — background job functions.
- `lib/embeddings/`, `lib/speech/`, `lib/calendar/`, `lib/ratelimit/`, `lib/email/`, `lib/analytics/`, `lib/mastery/`, `lib/resume/`, `lib/schemas/` — single-concern domain folders.
- `lib/errors.ts`, `lib/logger.ts` — shared infra primitives.
- `content/chapters/` — MDX chapter content.

Disallowed imports (also enforced by ESLint):
- `components/**` MUST NOT import from `lib/db`, `lib/ai`, `lib/inngest`, `lib/email`, or any server-only module.
- `lib/**` MUST NOT import from `components/**` or `app/**`.
- `lib/db` and `lib/ai` are peers — neither imports the other.
- `lib/inngest/**` is imported only by `app/api/inngest/route.ts`.

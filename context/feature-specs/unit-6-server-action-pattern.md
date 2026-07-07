# Unit 6 — Server Action pattern proof

> Status: Draft
> Last updated: 2026-05-19
> Owner: Jake

## User-visible behavior

None directly. Internally, one existing mutation moves from a Route Handler (`POST /api/profile/save`) to a Server Action that follows the 7-step skeleton in `code-standards.md`. The user experience of saving their profile is identical; the wire pattern changes.

The completed pattern becomes the reference for migrating the other ~15 Route-Handler-based mutations in subsequent units.

## Acceptance criteria

- [ ] A new Server Action `saveProfileAction` exists at `app/(app)/profile/actions.ts` (or wherever profile-edit UI lives) implementing the 7-step skeleton.
- [ ] The profile-edit form submits to this Server Action via `useFormState` / `useActionState` rather than `fetch('/api/profile/save')`.
- [ ] The action returns the discriminated union `{ ok: true, data } | { ok: false, error }` from `code-standards.md`.
- [ ] Zod schema is colocated in the same file as the action.
- [ ] The action uses the Drizzle query from Unit 3 (`updateProfile(db, userId, input)`) — write-path Drizzle proof.
- [ ] Auth check (`requireUser()`), rate-limit wrapping, ownership confirmation, structured logging (pino), Sentry capture on unexpected errors — all present.
- [ ] One row in `llm_usage` is **not** written (this action makes no LLM call). The rule "every LLM call logs to `llm_usage`" still holds elsewhere — this action just happens to be LLM-free.
- [ ] The legacy `POST /api/profile/save` Route Handler is either deleted or kept as a thin alias that calls the Server Action (decide in spec — see Open Questions).
- [ ] A comment block at the top of `actions.ts` documents the pattern for future unit authors: "This file is the canonical example of a Server Action that follows `code-standards.md` §Next.js → 7-step skeleton."
- [ ] Verification gates green; Playwright covers "user edits profile field, hits save, refresh, value persists."

## Out of scope

- **No migration of other mutations.** Resume save/extract, interview save/score/transcribe, relationships save/structure-chat/draft-followup/draft-outreach/prep-person, firm-prep — all stay as Route Handlers for now. Each gets its own migration unit.
- **No new error subclasses** beyond what `lib/errors.ts` already needs to expose for this action (`ValidationError`, `UnauthorizedError`, `RateLimitedError`).
- **No new rate-limit policies** designed beyond what this action needs (modest limit — profile edits aren't an abuse vector).
- **No client-side optimistic updates.** Submit → wait → re-render. Add optimistic UI later if it earns its place.

## Data model changes

None — `profiles` already exists; the action just writes to it.

## Surfaces affected

| Path | Change |
|---|---|
| `web/app/(app)/profile/actions.ts` | New — `saveProfileAction` |
| `web/app/(app)/profile/page.tsx` (or the form component) | Modify — form posts to Server Action |
| `web/app/api/profile/save/route.ts` | Delete OR convert to thin wrapper (see Open Questions) |
| `web/lib/db/queries/profiles.ts` | Modify — add `updateProfile(db, userId, input)` |
| `web/lib/errors.ts` | New (if not yet present) — `AppError`, `ValidationError`, `UnauthorizedError`, `RateLimitedError`, `LLMError`, `ExternalServiceError` |
| `web/lib/auth/server.ts` | Modify — confirm `requireUser()` matches what `code-standards.md` describes |
| `web/lib/ratelimit/limiters.ts` | New — named limiter (`profileMutationLimiter`) with reasonable bounds |
| `web/lib/logger.ts` | New (if not yet) — pino instance per `code-standards.md` §Logging |

## AI prompts and tool definitions

N/A.

## Edge cases

- **Concurrent edits:** two tabs saving simultaneously — last writer wins. Acceptable for profile.
- **Zod validation failure:** action returns `{ ok: false, error: { code: 'VALIDATION_FAILED', message, fieldErrors } }`; form surfaces fieldErrors next to each input.
- **Rate-limit hit:** action returns `{ ok: false, error: { code: 'RATE_LIMITED', message: 'Slow down a bit and try again.' } }`; form shows a toast.
- **DB constraint violation** (e.g. unique constraint on `target_firms` or invalid `current_semester` enum): caught by Drizzle, translated to `ValidationError` with a field error.
- **Unauthenticated submission:** middleware should catch it earlier, but the action's `requireUser()` is the defense-in-depth check. Returns `{ ok: false, error: { code: 'UNAUTHORIZED' } }`; form redirects to `/login?next=/profile`.
- **Unexpected error:** caught by the outermost try/catch in the action, captured to Sentry, returns `{ ok: false, error: { code: 'INTERNAL', message: 'Something went wrong.' } }`.

## Dependencies on other units

- Unit 2 (deps) — needs `ai`, `react-hook-form` if the form gets upgraded.
- Unit 3 (Drizzle wrap) — write-path Drizzle. **Or** this unit extends Unit 3 by adding the write side of Drizzle if Unit 3 was strictly read-only.
- Unit 4 (auth UI + middleware) — `requireUser()` and middleware both need to be in place.

## Verification and test plan

- **Demo path:**
  1. Sign in, open `/profile`.
  2. Edit `school` field; click save.
  3. Form shows "Saved" toast; page refreshes; new value persists.
  4. Force a validation error (e.g. blank required field); confirm `fieldErrors` appear inline.
  5. Hammer save 50× in 30s; confirm rate-limit error appears.
  6. Check Sentry dashboard — no spurious errors during happy path.
- **Tests:**
  - Vitest: Zod schema parses valid inputs, rejects invalid ones with `fieldErrors`.
  - Vitest: `saveProfileAction` returns `UNAUTHORIZED` when called without a session.
  - Vitest: `saveProfileAction` returns `RATE_LIMITED` when limit is exceeded (mock the limiter).
  - Vitest: `updateProfile` writes the right snake_case columns (use the existing test DB).
  - Playwright: edit field → save → refresh → value persists.
- **Verification gates** per `ai-workflow-rules.md`.

## Open questions

- **Delete or keep the Route Handler?** **Recommendation:** **delete.** The Server Action replaces it. If any external integration somehow depends on `POST /api/profile/save`, surface and decide. Probability of an external dependency on an internal API: zero.
- **Which existing client surface invokes the new action?** `web/app/(app)/profile/page.tsx` (probably wraps a Client Component for the form) — verify and pick the right boundary.
- **Optimistic updates in the form?** Skipped per Out of Scope; revisit if save latency feels long in real use (Vercel + Supabase round trip is usually <300ms).
- **Logger location:** confirm `lib/logger.ts` matches `code-standards.md` §Logging. If the existing `lib/logging/logger.ts` already exists from the prototype, fold into the spec rather than create a parallel file.

## References

- Server Action skeleton (7 steps): `code-standards.md` §Next.js → Server Actions
- Server Action return shape: `code-standards.md` §Next.js → Action shape
- AppError hierarchy: `code-standards.md` §Error Handling
- Pino logging: `code-standards.md` §Logging
- progress-tracker.md Unit 6 entry

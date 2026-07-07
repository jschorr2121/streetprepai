# Unit 4 — Auth UI + middleware + onboarding

> Status: Draft
> Last updated: 2026-05-19
> Owner: Jake

## User-visible behavior

A new visitor can:

1. **Sign up** with email + password OR Google OAuth.
2. **Sign in** with the same credentials and reach the dashboard.
3. **Recover access** via a password-reset email link.
4. **Be guided through onboarding** on first sign-in: a 1–3 step flow that collects school, grad year, current semester, and target firms. The user lands on `/dashboard` only after onboarding is complete.

## Acceptance criteria

- [ ] Unauthenticated visit to any `app/(app)/**` route redirects to `/login` (via middleware).
- [ ] Authenticated user without `profiles.onboarded_at` redirects to `/onboarding` (via middleware).
- [ ] Sign-up form validates client-side via react-hook-form + Zod, then submits to a Server Action.
- [ ] Sign-in form supports both email/password and Google OAuth.
- [ ] Password-reset email arrives via Supabase's built-in auth email (Resend wiring deferred to Unit 19); link returns user to a reset form.
- [ ] Onboarding submission writes `school`, `graduation_year`, `current_semester`, `target_firms` to `profiles` and sets `onboarded_at = now()`.
- [ ] Logout signs the user out and clears the session cookie.
- [ ] Verification gates green (typecheck + lint + build).
- [ ] Playwright e2e covers signup → onboarding → dashboard.

## Out of scope

- **No Resend integration** — password-reset emails use Supabase's default sender. Custom email templates land in Unit 19.
- **No MFA / 2FA.** Out of phase 1 entirely.
- **No magic-link auth** — Supabase supports it; we deliberately keep auth simple (email/password + Google).
- **No invite-only / waitlist gating.** Open signup. If we want gating later it's a separate unit.
- **No resume upload in onboarding** — resume upload is optional per `architecture.md`; UI for it lives on the Profile page. Onboarding asks only for the 4 required fields.
- **No `admins` table population** — admin role mechanics deferred until an admin UI is needed.
- **No account deletion** — Unit 25 separately.

## Data model changes

Tiny — most of what we need already exists. Two columns to add to `profiles` (if absent):

```sql
alter table public.profiles
  add column if not exists current_semester text,
  add column if not exists onboarded_at timestamptz;
```

(`school`, `graduation_year`, `target_firms` already exist per the introspection in Unit 3.)

RLS: confirm `profiles` has `USING (user_id = auth.uid())` + `WITH CHECK (user_id = auth.uid())`. If missing, add in this unit.

A row in `profiles` is created via a Supabase auth trigger on `auth.users` insert (or via the first onboarding submission, whichever pattern is already in place — confirm during implementation).

## Surfaces affected

| Path | Change |
|---|---|
| `web/middleware.ts` | New — Supabase session refresh + redirects |
| `web/app/(auth)/login/page.tsx` | New |
| `web/app/(auth)/signup/page.tsx` | New |
| `web/app/(auth)/forgot-password/page.tsx` | New |
| `web/app/(auth)/reset-password/page.tsx` | New |
| `web/app/(auth)/callback/route.ts` | New — Google OAuth callback handler |
| `web/app/(auth)/layout.tsx` | New — bare layout (no app sidebar) |
| `web/app/(app)/onboarding/page.tsx` | New |
| `web/app/(app)/onboarding/actions.ts` | New — `completeOnboardingAction` |
| `web/app/(auth)/login/actions.ts` | New — `signInAction`, `signInWithGoogleAction` |
| `web/app/(auth)/signup/actions.ts` | New — `signUpAction` |
| `web/app/(auth)/forgot-password/actions.ts` | New — `requestPasswordResetAction` |
| `web/components/app-nav.tsx` | Modify — add logout link |
| `web/lib/auth/server.ts` | Modify or new — `requireUser()`, `getCurrentUserOrNull()` |
| `web/lib/auth/middleware.ts` | New — middleware helpers (session refresh, gating) |
| `web/lib/db/queries/profiles.ts` | Modify (from Unit 3) — add `setOnboarded(db, userId, fields)` |
| `web/lib/schemas/` (or colocated) | Sign-up / sign-in / onboarding Zod schemas |

## AI prompts and tool definitions

N/A.

## Edge cases

- **Email taken on signup:** Supabase returns a specific error code; surface as a field-level error on the email input.
- **Google OAuth user lacks a `profiles` row:** the OAuth callback creates one before redirecting (or relies on the auth trigger).
- **Onboarding interrupted:** if a user closes the tab mid-onboarding, on next sign-in they land back on `/onboarding` because `onboarded_at` is still null. No data loss.
- **Direct visit to `/onboarding` when already onboarded:** redirect to `/dashboard`.
- **Direct visit to an auth route while signed in:** redirect to `/dashboard`.
- **Session expiry mid-session:** middleware refresh handles most cases; if a Server Action call fails with `UNAUTHORIZED`, the client shows a toast and redirects to `/login` with a `?next=...` to return after login.
- **Password too weak:** Supabase enforces a minimum; surface its error message.
- **Grad year sanity check:** clamp to a reasonable range (current year − 1 to current year + 6) on the schema.
- **`current_semester` enum:** validate against `{Freshman Fall, Freshman Spring, Sophomore Fall, Sophomore Spring, Junior Fall, Junior Spring, Senior Fall, Senior Spring}`.
- **`target_firms` minimum:** at least 1 firm. UI accepts free-form input + suggestion chips for the firms in `firms` table.

## Dependencies on other units

- Unit 2 (deps) — `react-hook-form`, `@hookform/resolvers`.
- Unit 3 (Drizzle wrap) — strongly recommended. Onboarding's mutation is the first user-write going through Drizzle; if Unit 3 doesn't cover writes, this unit becomes the proof-point for write-side Drizzle. That's fine — adjust Unit 6 (Server Action pattern proof) to layer cleanly on top of this.

## Verification and test plan

- **Demo path:**
  1. Visit `/dashboard` while signed out → redirect to `/login`.
  2. Click "Sign up", enter email + password, submit.
  3. Confirm email (Supabase default flow) or skip if email-confirmation is off in Supabase dashboard.
  4. Land on `/onboarding`; complete form; submit.
  5. Land on `/dashboard`.
  6. Click "Log out"; verify redirect to `/login`.
  7. Sign back in with the same credentials; land on `/dashboard` directly (no onboarding).
  8. From signed-in state, hit `/login` directly → redirect to `/dashboard`.
- **Tests:**
  - Vitest: Zod schemas reject invalid inputs (bad email, weak password, out-of-range grad year, missing target firms).
  - Vitest: `completeOnboardingAction` returns `{ ok: false, error: UNAUTHORIZED }` when called without a session.
  - Playwright: signup → onboarding → dashboard happy path (one e2e test).
  - Playwright: signed-out access to `/dashboard` redirects to `/login`.
- **Verification gates** per `ai-workflow-rules.md`.

## Open questions

- **Email verification on signup:** Supabase can require email-click before sign-in works. **Recommendation:** require email verification (lowers spam, standard practice). Configurable in Supabase dashboard — flag this for ops once.
- **Welcome email** — out of scope (Unit 19), but confirm: do we want a welcome email after onboarding? Likely yes; defer to Unit 19's spec.
- **Onboarding step count:** all-in-one page (single form, 4 fields) vs multi-step wizard. **Recommendation:** single page; it's only 4 fields. Faster to ship, lower abandonment.
- **`current_semester` enum location:** Zod enum vs Postgres enum vs plain text. **Recommendation:** Postgres `text` with a `check` constraint (or Drizzle's `varchar` + Zod enum). Avoid Postgres enum to keep migrations easy.
- **Sidebar logout link vs avatar menu:** **Recommendation:** an avatar / profile menu at the bottom of the sidebar (matches `ui-context.md` layout pattern). Logout, "Profile", and eventually "Settings" live in this menu.

## References

- Auth and Access Model: `architecture.md` §Auth and Access Model
- Onboarding rule: `architecture.md` §Auth → Onboarding
- Server Action skeleton: `code-standards.md` §Next.js
- progress-tracker.md Unit 4 entry

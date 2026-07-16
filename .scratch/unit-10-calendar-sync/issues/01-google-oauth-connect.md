# 01 — Connect / disconnect Google Calendar (OAuth + token storage)

Status: ready-for-agent
Blocked by: — (needs Jake's Google Cloud setup — see PRD "Jake-blocking setup")
PRD: ../PRD.md

## User-visible behavior

In the Relationship Manager, a "Connect Google Calendar" card starts the Google consent flow (calendar.readonly). On return, the card shows "Connected as jake@…" with a Disconnect button. Disconnect revokes the token at Google and deletes the stored connection.

## Scope

1. **Migration `web/supabase/migrations/0008_google_calendar.sql`** (idempotent):
   - `google_calendar_connections` (`user_id uuid PK`, `google_email text`, `refresh_token_enc text`, `access_token text`, `access_token_expires_at timestamptz`, `sync_token text`, `channel_id text`, `channel_resource_id text`, `channel_expires_at timestamptz`, `created_at`, `updated_at`). Owner RLS.
   - `calendar_events` additions: `google_event_id text`, `google_calendar_id text`, `attendees jsonb`, `synced_at timestamptz`, `link_source text` (`manual|auto`); unique index on `(user_id, google_event_id)` where not null.
   - Introspect/hand-author Drizzle schema files per Unit 3 convention.
2. **Crypto helper `web/lib/calendar/crypto.ts`:** AES-256-GCM encrypt/decrypt of the refresh token using `GOOGLE_TOKEN_ENC_KEY` (32-byte base64 env secret) via node `crypto`. Unit-test round-trip + tamper failure.
3. **OAuth flow `web/lib/calendar/oauth.ts`** using `googleapis` (`google.auth.OAuth2`) — **consult current googleapis docs via `find-docs` first**:
   - `getAuthUrl(userId)` — scope `calendar.readonly`, `access_type=offline`, `prompt=consent`, and a signed `state` param (HMAC of userId + nonce, verified on callback — CSRF protection is mandatory).
   - `exchangeCode(code)` → tokens + userinfo email; `getAuthedClient(userId)` → refreshes access token when expired, persists the refresh.
4. **Routes/actions:**
   - `GET app/api/auth/google-calendar/route.ts` — `requireUser`, redirect to consent URL. (Redirect flows can't be Server Actions; this is an allowed handler.)
   - `GET app/api/auth/google-calendar/callback/route.ts` — verify state, exchange code, encrypt + upsert connection row, redirect to `/tools/relationships?calendar=connected`. On error → `?calendar=error`.
   - `disconnectCalendarAction` in `app/(app)/tools/relationships/actions.ts` — 7-step skeleton; call Google token revoke endpoint (best-effort), delete the row.
   - Rate-limit both route handlers with the auth-action limiter pattern (IP or user keyed) — OAuth endpoints are abuse surfaces.
5. **UI:** `ConnectCalendarCard` client component on the relationships page: disconnected / connected(email) / error states; reads status from a server-loaded prop (`getConnection(db, userId)` in new `lib/db/queries/calendar.ts`).
6. **Audit:** insert an `audit`-style log line via `logger` on connect/disconnect (the `audit_log` table from architecture doesn't exist yet — logging suffices; note it in the PR).
7. **Env:** add `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`, `GOOGLE_TOKEN_ENC_KEY` to `.env.example` only (never touch `.env.local` values — Jake's task).
8. **Tests:** crypto round-trip; state HMAC sign/verify (tampered state rejected); callback handler with mocked googleapis (happy path upsert, error redirect); disconnect action gates.

## Verification

All six done-gates. Manual: full consent round-trip against Jake's Google Cloud test client; row present with encrypted token (verify ciphertext ≠ plaintext in DB); disconnect removes row.

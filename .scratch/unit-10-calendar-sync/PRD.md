# PRD — Unit 10: Google Calendar OAuth + event sync + contact auto-link

Status: ready-for-agent
Date: 2026-07-07
Sources: `context/project-overview.md` (Goal 11, Feature "Relationship Manager", Success Criterion 9), `context/architecture.md` (Stack "Calendar integration", `lib/calendar/`, `api/webhooks/google-calendar/`, Storage `calendar_events`, Invariants 3, 8, 10), `context/progress-tracker.md` (Unit 10 backlog)

## Problem

The spec promises: connect Google Calendar → coffee chats and interviews sync in → events auto-link to contacts → prep sheets are ready before each event. Today there is **zero** calendar integration code: `googleapis` is installed but unimported, the Relationship Manager list page renders **seed data**, `calendar_events` has no Google linkage columns, and there is no token storage. (The only Google OAuth in the app is Supabase *sign-in*, which is unrelated — Calendar needs its own direct OAuth per the locked stack decision.)

## What exists to build on

- `calendar_events` table (`lib/db/schema/calendar-events.ts`): id, userId, contactId (nullable), chatLogId, title, kind, startsAt, durationMinutes, location, status, notes. Needs Google columns added.
- `contacts` table + `lib/data/contacts.ts` reads; relationships pages at `app/(app)/tools/relationships/`.
- `lib/errors.ts#ExternalServiceError` (docstring already anticipates Google Calendar), 7-step action skeleton, `withUser` pattern, `lib/security/require-user.ts` for Route Handlers.
- `inngest` v4 installed, **no client/route yet** — this unit bootstraps it (architecture invariant 8: background work runs in Inngest).

## Target user-visible behavior

1. User clicks "Connect Google Calendar" in the Relationship Manager, goes through Google consent (calendar read-only scope), and returns to a "Connected as <email>" state with a working Disconnect.
2. Their upcoming events sync into the app and render on the relationships page (replacing seed data), tagged by kind (coffee chat / interview / other).
3. Events are auto-linked to contacts by matching attendee emails and name-in-title heuristics; linked events show the contact chip and appear on the contact's detail page.
4. Calendar changes propagate without manual refresh (Google push webhook → incremental sync), with a periodic Inngest fallback sweep.

## Architecture decisions (this PRD)

- **Direct Google OAuth 2.0** (not Supabase provider tokens): own client ID/secret, `https://www.googleapis.com/auth/calendar.readonly` scope only, `access_type=offline` + granular consent. Locked in CHANGES.md stack decisions.
- **Token storage:** new table `google_calendar_connections` (user_id PK, google_email, refresh_token **encrypted at the app layer** — AES-256-GCM with a dedicated `GOOGLE_TOKEN_ENC_KEY` env secret —, access token + expiry cached in-row, sync_token, channel fields). RLS owner-scoped for reads; writes go through server code only. Access tokens are refreshed server-side via `googleapis`.
- **`lib/calendar/`** is the single home for OAuth flow, sync, matching, and webhook business logic (per architecture boundaries). Route handlers stay thin.
- **Webhook + Inngest:** `app/api/webhooks/google-calendar/route.ts` receives push notifications (validates `X-Goog-Channel-Token`), then triggers sync. Sync execution and daily channel-renewal run as **Inngest functions** (`lib/inngest/` + `app/api/inngest/route.ts` bootstrapped in issue 04). Webhooks are service-role paths — explicit, auditable (invariant 3).
- **Read-only phase 1.** We never write to the user's calendar. Event creation/scheduling is out of scope.

## Jake-blocking setup (tracked in `context/jakes-tasks.md`)

Google Cloud project: enable Calendar API, configure OAuth consent screen (external, test users while unverified), create OAuth client (web), set redirect URI(s), provide `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET` / `GOOGLE_TOKEN_ENC_KEY` env values (local + Vercel). Webhook push additionally needs a public HTTPS URL (works on Vercel previews/prod; dev falls back to manual/Inngest sync).

## Out of scope

- Pre-event prep-sheet generation (its own unit — depends on this one).
- Two-way calendar writes, non-Google calendars, email ingestion.
- Post-event note prompts / follow-up automation.

## Success criteria

`project-overview.md` Success Criterion 9, minus prep sheets: connect calendar → coffee chats and interviews appear auto-linked to contacts. All six done-gates per issue.

## Issues (tracer-bullet DAG)

| # | Slice | Blocked by |
|---|-------|-----------|
| 01 | OAuth connect/disconnect + token storage | — |
| 02 | Event sync + real events UI | 01 |
| 03 | Auto-link events to contacts | 02 |
| 04 | Push webhook + Inngest bootstrap + channel renewal | 02 |

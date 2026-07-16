# 02 — Sync upcoming events + render real events in the Relationship Manager

Status: ready-for-agent
Blocked by: 01
PRD: ../PRD.md

## User-visible behavior

Once connected, the user's upcoming Google Calendar events (next 30 days) appear in the Relationship Manager's calendar/upcoming section — real data replacing `seedCalendarEvents`. A "Sync now" affordance refreshes on demand. Events are classified by kind (coffee-chat / interview / other) so recruiting-relevant items stand out.

## Scope

1. **Sync engine `web/lib/calendar/sync.ts`:**
   - `syncEvents(userId)` — authed client from issue 01; `events.list` on `primary` with `syncToken` when present (incremental) else `timeMin=now, timeMax=+30d, singleEvents=true` (full); handle `410 GONE` → drop sync token, full resync. Persist new `nextSyncToken`.
   - Upsert into `calendar_events` keyed on `(user_id, google_event_id)`: title, startsAt, durationMinutes, location, status (map cancelled → delete or mark), `attendees` jsonb (email, displayName, responseStatus), `synced_at`.
   - **Kind classification** — pure function `classifyEventKind({ title, attendees })` in `lib/calendar/classify.ts`: keyword heuristics (coffee/chat/intro/catch up → `coffee_chat`; interview/superday/hirevue → `interview`; else `other`). Unit-test the table of cases. No LLM call for this.
   - Wrap Google errors in `ExternalServiceError`.
2. **Queries `lib/db/queries/calendar.ts`:** `upsertEvents`, `getUpcomingEvents(db, userId, { from, to })`, `deleteEventsByGoogleIds`.
3. **Server Action:** `syncCalendarAction` — 7-step skeleton; rate-limited (e.g. 6/min — each sync is a Google API burst); returns `{ synced: n }` for a toast.
4. **Trigger sync on connect:** issue 01's callback route fires an initial `syncEvents` inline (first sync is small; the Inngest path arrives in issue 04 — leave a `// TODO(unit-10/04)` handoff note).
5. **UI:** relationships page upcoming-events widget reads `getUpcomingEvents` via `withUser` (server component) instead of `seedCalendarEvents`; kind badge per event; "Sync now" button (client, calls the action, sonner toast); graceful empty/not-connected states. Delete the seed-array usage from the page (keep `lib/data/calendar.ts` seeds only if tests use them; otherwise remove).
6. **Note on writes:** sync runs server-side on behalf of the user — write through `withUser` where the session is available (action path); the callback/background path may use the admin client explicitly and auditable, scoped strictly to that user's rows (matches the architecture's service-role rules).
7. **Tests:** classifier table-driven tests; sync engine with mocked googleapis (full sync, incremental, 410 reset, cancelled event removal); PGlite upsert idempotency + isolation.

## Verification

All six done-gates. Manual: create a "Coffee chat with Sarah (GS)" event in Google Calendar → Sync now → appears with coffee-chat badge; cancel it in Google → sync → gone.

# 04 — Push webhook + Inngest bootstrap + channel renewal

Status: ready-for-agent
Blocked by: 02
PRD: ../PRD.md

## User-visible behavior

Calendar changes show up in the app without pressing "Sync now": edit an event in Google Calendar and it's updated in the Relationship Manager within seconds (on deployed environments). Connections stay live indefinitely because watch channels renew themselves.

## Scope

1. **Inngest bootstrap (first use in the repo — foundational):**
   - `web/lib/inngest/client.ts` — the Inngest client (`id: "street-prep"`).
   - `web/app/api/inngest/route.ts` — the serve handler.
   - Consult current Inngest v4 + Next.js App Router docs via `find-docs` before coding.
   - Env: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` → `.env.example`; Jake creates the Inngest account/app and sets values (add to `context/jakes-tasks.md`).
   - Architecture invariant 8 note: from this point on, background work goes here — this bootstrap also unblocks future units (firm refresh, media retention sweeps, q-bank nudges).
2. **Watch channels `web/lib/calendar/watch.ts`:** `startWatch(userId)` — `events.watch` on `primary` with a generated `channel_id` + per-user `X-Goog-Channel-Token` secret (random, stored on the connection row); persist `channel_id`, `resource_id`, `channel_expires_at`. `stopWatch(userId)` on disconnect (extend issue 01's disconnect action).
3. **Webhook `web/app/api/webhooks/google-calendar/route.ts`:**
   - Validate `X-Goog-Channel-Token` against the stored per-user secret and `X-Goog-Channel-ID` against the connection row; 404 unknown channels. **This endpoint is unauthenticated by nature — token validation is its auth; do not skip.** Rate-limit by channel id (degrade-open).
   - On `sync`/`exists` notifications: emit an Inngest event `calendar/sync.requested { userId }` and return 200 immediately (webhooks must not do slow work inline — invariant 8).
4. **Inngest functions `web/lib/inngest/functions/calendar.ts`:**
   - `calendarSync` — on `calendar/sync.requested`, debounced per user (~30s), runs `syncEvents(userId)` (service-role path, per-user scoped).
   - `calendarChannelRenewal` — daily cron: for connections with `channel_expires_at` within 48h, `stopWatch` + `startWatch`. Also acts as a fallback sweep: re-sync connections whose `synced_at` is older than 24h (covers dev/local where webhooks can't reach).
5. **Connect flow update:** issue 01's callback additionally calls `startWatch` (best-effort — local dev without a public URL logs and continues; manual/cron sync still works).
6. **Tests:** webhook handler — bad token 403/404, valid → Inngest event emitted (mock client), no inline sync; watch lifecycle with mocked googleapis; renewal function selection logic (PGlite: expiring vs fresh channels).

## Deployment caveat (call out in PR)

Push channels require a public HTTPS webhook URL — verify on a Vercel preview; local dev relies on the daily/cron fallback and manual sync. Add "confirm webhook URL + test push on preview deploy" to `context/jakes-tasks.md`.

## Verification

All six done-gates. On a preview deploy: connect → edit an event in Google → it updates in-app without manual sync; check Inngest dashboard shows the run.

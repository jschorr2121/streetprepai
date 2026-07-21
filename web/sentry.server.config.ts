// Sentry server runtime config (Node.js).
//
// Loaded from `instrumentation.ts` when NEXT_RUNTIME === "nodejs".
// Initializes the Sentry SDK only when SENTRY_DSN is set; absence
// leaves the SDK as a no-op so local dev without env vars works fine.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // Sample 100% of traces in dev for visibility, 10% in prod for cost.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Replays are a browser-only feature; harmless to leave the keys here
    // but they have no effect server-side. Documenting intent for parity
    // with the client config.
    sendDefaultPii: false,
    // Turns every `logger.error(...)` call (lib/logging/logger.ts, pino) into a
    // real Sentry event — no per-call-site Sentry.captureException wiring
    // needed. Node-runtime only, matching where pino runs (no edge/browser
    // pino variant exists), so this stays out of sentry.edge.config.ts.
    // `enableLogs` also forwards every pino log line (any level, see the
    // integration's default `log.levels`) to Sentry's Logs product.
    // Verified against the installed @sentry/nextjs@10.51.0 (>= the 10.18.0
    // pinoIntegration requires) .d.ts — the option shape here is
    // `{ error: { levels: [...] } }`, NOT the `{ captureErrors: [...] }` shape
    // some docs/snippets describe.
    enableLogs: true,
    integrations: [Sentry.pinoIntegration({ error: { levels: ["error"] } })],
    // Strip request bodies & potentially-PII payloads before transmission.
    // The app passes user-pasted LinkedIn bios, interview transcripts, and
    // resume text through API routes. We never want those leaving the box.
    beforeSend(event) {
      if (event.request) {
        const safeRequest: NonNullable<typeof event.request> = {
          url: event.request.url,
          method: event.request.method,
        };
        // `data` may contain JSON-stringified bodies — drop entirely.
        // Keep only safe top-level fields.
        event.request = safeRequest;
      }
      // Drop any user-supplied context that may have been attached.
      if (event.user) {
        event.user = { id: event.user.id };
      }
      return event;
    },
  });
}

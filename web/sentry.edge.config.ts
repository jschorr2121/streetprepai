// Sentry edge runtime config.
//
// Loaded from `instrumentation.ts` when NEXT_RUNTIME === "edge".
// Same DSN/env vars as the server config; the SDK ships an edge-specific
// build automatically via the package's "edge" export condition.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        event.request = {
          url: event.request.url,
          method: event.request.method,
        };
      }
      if (event.user) {
        event.user = { id: event.user.id };
      }
      return event;
    },
  });
}

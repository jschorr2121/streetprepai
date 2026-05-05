// Sentry client SDK init (Next.js 15 convention: `instrumentation-client.ts`
// at the project root is loaded by Next on the client before app code).
//
// Initializes Sentry only when NEXT_PUBLIC_SENTRY_DSN is set; otherwise
// the SDK stays a no-op so local dev without env vars works fine.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Session Replay: off by default (privacy), on for sessions that hit an
    // error so we get post-mortem context without recording every visitor.
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
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

// Required by `@sentry/nextjs` to instrument App Router client navigation
// transitions. Re-exporting it as the documented hook name silences the
// build-time warning and gives Sentry visibility into route changes.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

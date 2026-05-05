// Next.js instrumentation hook.
//
// `register()` runs once when the server boots; we lazy-import the
// runtime-specific Sentry config so edge bundles don't pull in Node SDK
// code (and vice versa).
//
// `onRequestError` is the App Router hook for server-side errors thrown
// inside React Server Components, route handlers, and server actions.
// Re-exporting `Sentry.captureRequestError` wires those automatically
// into Sentry.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

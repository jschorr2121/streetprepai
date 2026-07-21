import { logger } from "@/lib/logging/logger";

// Client-safe error reporting for Route Handlers. Raw error text from upstream
// SDKs, parsers, or Postgres can leak hostnames, request internals, or schema
// details — log the real error server-side and hand the client a stable,
// display-safe message instead.
//
// Routes through the shared pino `logger` (not raw `console.error`) so every
// call site becomes a real Sentry event via the server config's
// `pinoIntegration` — with zero per-route wiring. The `err` key matches pino's
// default error serializer/key, which the Sentry integration also reads to
// attach a stack trace instead of falling back to a bare message.
export function clientSafeError(route: string, err: unknown, publicMessage: string): string {
  logger.error({ route, err }, "route_error");
  return publicMessage;
}

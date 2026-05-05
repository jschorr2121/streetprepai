/**
 * Structured server logger built on pino.
 *
 * - Pretty output in development via `pino-pretty` transport.
 * - Plain JSON in production — one log line per event, ready for
 *   Vercel logs / aggregators.
 * - Exposes a `createRouteLogger(routeKey, userId?)` factory that
 *   returns a child logger pre-tagged with the route and user.
 *
 * Designed to never crash if optional env or transports misconfigure;
 * we fall back to a base pino logger on any transport failure.
 */

import pino, { type Logger } from "pino";

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? (isProd ? "info" : "debug");

function buildLogger(): Logger {
  if (isProd) {
    return pino({
      level,
      base: { service: "street-prep-ai" },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  // Dev: pino-pretty for readable output. If the transport fails to
  // load (e.g. in some bundling contexts), gracefully fall back.
  try {
    return pino({
      level,
      base: { service: "street-prep-ai" },
      timestamp: pino.stdTimeFunctions.isoTime,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          ignore: "pid,hostname,service",
        },
      },
    });
  } catch {
    return pino({ level, base: { service: "street-prep-ai" } });
  }
}

export const logger: Logger = buildLogger();

export default logger;

/**
 * Build a child logger pre-tagged with `routeKey` and (optionally) `userId`.
 * Used by `getRequestLogger()` in `request-context.ts` — most app code
 * should go through that helper rather than calling this directly.
 */
export function createRouteLogger(routeKey: string, userId?: string): Logger {
  const bindings: Record<string, string> = { routeKey };
  if (userId) bindings.userId = userId;
  return logger.child(bindings);
}

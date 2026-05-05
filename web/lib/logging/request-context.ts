/**
 * Per-request logger helper.
 *
 * Routes call `getRequestLogger(req, "chat/stream", userId)` to obtain
 * a pino child logger pre-tagged with `requestId`, `routeKey`, and
 * (optionally) `userId`. Every log line emitted from that logger
 * automatically carries those fields.
 *
 * The request id is taken from the `x-request-id` header when present
 * (so upstream proxies / load balancers can stitch traces) and
 * generated via `crypto.randomUUID()` otherwise.
 */

import type { Logger } from "pino";
import { logger } from "./logger";

function generateRequestId(): string {
  // `crypto.randomUUID` exists in Node 19+ and in modern browsers.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Last-resort fallback. Not cryptographically strong but only for log id.
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function extractRequestId(req: Request): string {
  const fromHeader = req.headers.get("x-request-id");
  if (fromHeader && fromHeader.length > 0 && fromHeader.length <= 200) {
    return fromHeader;
  }
  return generateRequestId();
}

export function getRequestLogger(req: Request, routeKey: string, userId?: string): Logger {
  const requestId = extractRequestId(req);
  const bindings: Record<string, string> = { requestId, routeKey };
  if (userId) bindings.userId = userId;
  return logger.child(bindings);
}

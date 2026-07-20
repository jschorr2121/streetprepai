import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { logger } from "@/lib/logging/logger";

/**
 * GET /api/health — trivial liveness probe for external uptime monitors.
 * No auth (exempted in `lib/auth/middleware.ts`'s /api/* backstop) and no
 * rate limiting — a `select 1` is cheap enough that wiring a limiter isn't
 * worth the complexity for this route.
 *
 * Never leaks error details: a DB failure returns a bare 503, nothing else.
 */

// Never statically cache a liveness probe — every hit must reach the DB.
export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3_000;

export async function GET(): Promise<Response> {
  try {
    await Promise.race([
      getDb().execute(sql`select 1`),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error("health check timed out")), DB_TIMEOUT_MS),
      ),
    ]);
    return Response.json({ status: "ok" }, { status: 200 });
  } catch {
    // Logged server-side only — the client response never carries error
    // details (code-standards §Error Handling).
    logger.warn({ action: "health_check_failed" }, "health_check_failed");
    return Response.json({ status: "degraded" }, { status: 503 });
  }
}

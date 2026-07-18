import { buildLimiter, type LimiterCheck, type StoreErrorMode } from "@/lib/ratelimit/core";

/**
 * Per-route tier. Tunes the request budget and burst window.
 *
 * - cheap     : Haiku-class or non-AI routes (CRUD, drafts).      30/min user · 90/min IP
 * - expensive : Sonnet/Opus-class AI routes.                       10/min user · 30/min IP
 * - whisper   : Audio transcription. Long-tailed cost per call.    6/min  user · 12/min IP
 * - public    : Unauth-eligible read endpoints (rare).             60/min IP only
 */
export type RateTier = "cheap" | "expensive" | "whisper" | "public";

const TIER_CONFIG: Record<
  RateTier,
  { user: { requests: number; windowSec: number }; ip: { requests: number; windowSec: number } }
> = {
  cheap: { user: { requests: 30, windowSec: 60 }, ip: { requests: 90, windowSec: 60 } },
  expensive: { user: { requests: 10, windowSec: 60 }, ip: { requests: 30, windowSec: 60 } },
  whisper: { user: { requests: 6, windowSec: 60 }, ip: { requests: 12, windowSec: 60 } },
  public: { user: { requests: 0, windowSec: 60 }, ip: { requests: 60, windowSec: 60 } },
};

/**
 * Store-failure policy by tier. AI tiers (expensive, whisper) fail CLOSED — a
 * Redis outage must not grant unmetered LLM spend (AI fail-closed invariant).
 * Non-AI tiers (cheap CRUD, public reads) fail OPEN so an infra outage never
 * 500s a route that has no cost exposure.
 */
const STORE_ERROR_BY_TIER: Record<RateTier, StoreErrorMode> = {
  cheap: "allow",
  expensive: "deny",
  whisper: "deny",
  public: "allow",
};

// Cache built limiter closures by prefix + budget so the underlying Upstash
// client (and the in-memory fallback bucket state) persists across requests.
const limiterCache = new Map<string, (key: string) => Promise<LimiterCheck>>();
function getLimiter(
  prefix: string,
  requests: number,
  windowSec: number,
  onStoreError: StoreErrorMode,
): (key: string) => Promise<LimiterCheck> {
  const cacheKey = `${prefix}:${requests}:${windowSec}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    // memFallback: local dev / tests count in-memory to the cap instead of
    // degrading open. In production a configured Upstash store is used.
    limiter = buildLimiter(prefix, requests, windowSec, { onStoreError, memFallback: true });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

export type RateLimitResult = {
  ok: boolean;
  reason?: "user" | "ip";
  retryAfterSec: number;
};

function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Check both per-user and per-IP buckets. The first to deny wins.
 * Use `null` for `userId` on unauth-eligible routes (IP bucket only).
 */
export async function checkRateLimit(
  req: Request,
  userId: string | null,
  tier: RateTier,
  routeKey: string,
): Promise<RateLimitResult> {
  const cfg = TIER_CONFIG[tier];
  const ip = ipFromRequest(req);
  const onStoreError = STORE_ERROR_BY_TIER[tier];

  // Per-user check (skip for public tier or when no user). First bucket to deny
  // wins, so this runs before the IP check.
  if (userId && cfg.user.requests > 0) {
    const userKey = `rl:u:${tier}:${routeKey}:${userId}`;
    const userLimiter = getLimiter(
      `rl:u:${tier}:${routeKey}`,
      cfg.user.requests,
      cfg.user.windowSec,
      onStoreError,
    );
    const r = await userLimiter(userKey);
    if (!r.allowed) {
      return { ok: false, reason: "user", retryAfterSec: r.retryAfterSeconds };
    }
  }

  // Per-IP check
  if (cfg.ip.requests > 0) {
    const ipKey = `rl:i:${tier}:${routeKey}:${ip}`;
    const ipLimiter = getLimiter(
      `rl:i:${tier}:${routeKey}`,
      cfg.ip.requests,
      cfg.ip.windowSec,
      onStoreError,
    );
    const r = await ipLimiter(ipKey);
    if (!r.allowed) {
      return { ok: false, reason: "ip", retryAfterSec: r.retryAfterSeconds };
    }
  }

  return { ok: true, retryAfterSec: 0 };
}

/**
 * 429 Response builder. Sets Retry-After header per RFC 6585.
 */
export function tooManyRequests(result: RateLimitResult): Response {
  return Response.json(
    { error: "Too many requests", reason: result.reason },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, result.retryAfterSec)) },
    },
  );
}

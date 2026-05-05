import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

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

// In-memory fallback for local dev when Upstash env is unset.
type Bucket = { count: number; resetAt: number };
const memBuckets = new Map<string, Bucket>();

function memCheck(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = memBuckets.get(key);
  if (!b || b.resetAt <= now) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, resetAt: b.resetAt };
}

const rlCache = new Map<string, Ratelimit>();
function rl(prefix: string, requests: number, windowSec: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${prefix}:${requests}:${windowSec}`;
  let inst = rlCache.get(key);
  if (!inst) {
    inst = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, `${windowSec} s`),
      prefix,
      analytics: false,
    });
    rlCache.set(key, inst);
  }
  return inst;
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

  // Per-user check (skip for public tier or when no user)
  if (userId && cfg.user.requests > 0) {
    const userKey = `rl:u:${tier}:${routeKey}:${userId}`;
    const userLimiter = rl(`rl:u:${tier}:${routeKey}`, cfg.user.requests, cfg.user.windowSec);
    if (userLimiter) {
      const r = await userLimiter.limit(userKey);
      if (!r.success) {
        return {
          ok: false,
          reason: "user",
          retryAfterSec: Math.ceil((r.reset - Date.now()) / 1000),
        };
      }
    } else {
      const r = memCheck(userKey, cfg.user.requests, cfg.user.windowSec * 1000);
      if (!r.ok)
        return {
          ok: false,
          reason: "user",
          retryAfterSec: Math.ceil((r.resetAt - Date.now()) / 1000),
        };
    }
  }

  // Per-IP check
  if (cfg.ip.requests > 0) {
    const ipKey = `rl:i:${tier}:${routeKey}:${ip}`;
    const ipLimiter = rl(`rl:i:${tier}:${routeKey}`, cfg.ip.requests, cfg.ip.windowSec);
    if (ipLimiter) {
      const r = await ipLimiter.limit(ipKey);
      if (!r.success) {
        return { ok: false, reason: "ip", retryAfterSec: Math.ceil((r.reset - Date.now()) / 1000) };
      }
    } else {
      const r = memCheck(ipKey, cfg.ip.requests, cfg.ip.windowSec * 1000);
      if (!r.ok)
        return {
          ok: false,
          reason: "ip",
          retryAfterSec: Math.ceil((r.resetAt - Date.now()) / 1000),
        };
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

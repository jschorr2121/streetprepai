/**
 * Shared sliding-window rate-limit primitive.
 *
 * Both rate-limit surfaces are thin adapters over `buildLimiter`:
 * - Route Handlers  → `lib/security/rate-limit.ts#checkRateLimit`
 * - Server Actions  → `lib/ratelimit/limiters.ts` (named limiters)
 *
 * This module owns everything the two surfaces used to duplicate: the lazy
 * Redis lookup, the "no Upstash in production" alert-once handling, the
 * store-error policy ("deny" for AI/fail-closed limiters, "allow" for
 * auth/CRUD/fail-open limiters), result normalization, and an OPTIONAL
 * in-memory COUNTING fallback for local dev / unit tests.
 *
 * STORE-FAILURE POLICY (R1/R3):
 * - `onStoreError: "allow"` (default) degrades OPEN when the store is
 *   unreachable — a dead store must never crash a mutation or lock users out.
 * - `onStoreError: "deny"` fails CLOSED — every allowed call is real LLM spend,
 *   so an unreachable store denies with a retry hint instead of granting
 *   unmetered usage (architecture invariant: AI rate limits are fail-closed).
 *
 * The in-memory fallback (`memFallback: true`) actually COUNTS to the cap; it
 * must NOT degrade open, because dev flows and unit tests depend on it enforcing
 * the limit. It takes precedence over the store-error policy when there is no
 * Redis client, so a `memFallback` limiter counts locally rather than denying.
 */

import * as Sentry from "@sentry/nextjs";
import { Ratelimit } from "@upstash/ratelimit";

import { logger } from "@/lib/logging/logger";
import { getRedis } from "@/lib/security/redis";

export type StoreErrorMode = "allow" | "deny";

/** Normalized result shape returned by every limiter built here. */
export type LimiterCheck = { allowed: boolean; retryAfterSeconds: number };

export type BuildLimiterOptions = {
  /** Policy when the store is unreachable (throws). Default "allow". */
  onStoreError?: StoreErrorMode;
  /**
   * When true, and no Redis client is configured, count requests in-memory up
   * to the cap instead of applying the store-error policy. For local dev and
   * unit tests. Must not degrade open — it enforces the limit.
   */
  memFallback?: boolean;
};

// Tracks whether we have already emitted the "rate limiting disabled in
// production" warning for each prefix, so it fires once per cold start rather
// than on every request.
const warnedMisconfiguredPrefixes = new Set<string>();

// Shared in-memory counting buckets for the optional dev/test fallback. Keyed
// by the full limiter key (which already includes prefix / tier / route / id),
// so a single global map is safe.
type Bucket = { count: number; resetAt: number };
const memBuckets = new Map<string, Bucket>();

function memCheck(key: string, limit: number, windowMs: number): LimiterCheck {
  const now = Date.now();
  const b = memBuckets.get(key);
  if (!b || b.resetAt <= now) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (b.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  b.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

/**
 * Build a sliding-window limiter closure. The returned function takes a key and
 * resolves to a normalized `{ allowed, retryAfterSeconds }` result.
 *
 * Redis is resolved lazily on first use and the underlying Upstash `Ratelimit`
 * instance is memoized for the life of the closure.
 */
export function buildLimiter(
  prefix: string,
  requests: number,
  windowSec: number,
  opts: BuildLimiterOptions = {},
): (key: string) => Promise<LimiterCheck> {
  const onStoreError = opts.onStoreError ?? "allow";
  const memFallback = opts.memFallback ?? false;

  let limiter: Ratelimit | null = null;
  let resolved = false;

  return async (key: string): Promise<LimiterCheck> => {
    if (!resolved) {
      const redis = getRedis();
      if (redis) {
        limiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(requests, `${windowSec} s`),
          prefix,
          analytics: false,
        });
      }
      resolved = true;
    }

    if (!limiter) {
      // No Upstash client in this environment.
      if (memFallback) {
        // Enforce the limit in-memory (dev / tests). Must count, not open.
        return memCheck(key, requests, windowSec * 1000);
      }

      // In production this is a misconfiguration — alert once per cold start.
      if (isProduction()) {
        if (!warnedMisconfiguredPrefixes.has(prefix)) {
          warnedMisconfiguredPrefixes.add(prefix);
          logger.error({ prefix }, "rate_limiting_disabled_no_redis");
          Sentry.captureMessage(
            `Rate limiting disabled — Upstash env not set (prefix: ${prefix})`,
            { level: "error" },
          );
        }
        if (onStoreError === "deny") {
          // Fail closed: unmetered LLM spend is worse than a blocked feature.
          return { allowed: false, retryAfterSeconds: 60 };
        }
      }

      // Degrade open: allow all calls when env is missing (dev/preview, or a
      // fail-open limiter in production).
      return { allowed: true, retryAfterSeconds: 0 };
    }

    try {
      const result = await limiter.limit(key);
      if (result.success) return { allowed: true, retryAfterSeconds: 0 };
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      };
    } catch (err) {
      // Store unreachable (DNS failure, network timeout, etc.). Log + alert,
      // then apply the store-failure policy: deny for AI spend, allow for
      // auth/CRUD so infra outages never crash those paths.
      logger.error({ err, prefix }, "ratelimit_store_error");
      Sentry.captureException(err);
      if (onStoreError === "deny") {
        return { allowed: false, retryAfterSeconds: 30 };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    }
  };
}

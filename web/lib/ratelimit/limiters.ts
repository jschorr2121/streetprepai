/**
 * Named rate limiters for Server Actions.
 *
 * Architecture: reuses the Upstash Redis client (`lib/security/redis.ts`) and
 * the Ratelimit class already imported by `lib/security/rate-limit.ts`. This
 * module is the canonical home for Server Action limiters; Route Handler
 * limiters live in `lib/security/rate-limit.ts` (unchanged).
 *
 * Each limiter is a sliding-window Upstash Ratelimit keyed by `userId` (not
 * IP) — Server Actions run after auth, so user identity is always known.
 *
 * If Upstash env is unset (local dev without Redis), `check()` returns
 * `{ allowed: true }` so development is unblocked. Production must have
 * `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set.
 *
 * STORE-FAILURE POLICY (R1/R3, tightened for AI spend):
 * - Non-AI limiters (auth, CRUD) degrade OPEN when the Upstash store is
 *   unreachable: a dead store must never crash a mutation or lock users out
 *   of sign-in. Operators are alerted via Sentry + logger.error.
 * - AI-calling limiters ({ onStoreError: "deny" }) fail CLOSED: every allowed
 *   call is real LLM spend, so an unreachable store denies with a retry hint
 *   instead of granting unmetered usage (architecture invariant: AI rate
 *   limits are fail-closed).
 */

import * as Sentry from "@sentry/nextjs";
import { Ratelimit } from "@upstash/ratelimit";

import { logger } from "@/lib/logging/logger";
import { getRedis } from "@/lib/security/redis";

export type LimiterResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

// Tracks whether we have already emitted the "rate limiting disabled in
// production" warning for each prefix, so it fires once per cold start rather
// than on every request.
const warnedMisconfiguredPrefixes = new Set<string>();

type StoreErrorMode = "allow" | "deny";

function makeSlidingWindow(
  prefix: string,
  requests: number,
  windowSec: number,
  opts: { onStoreError: StoreErrorMode } = { onStoreError: "allow" },
): (key: string) => Promise<LimiterResult> {
  const redis = getRedis();

  if (!redis) {
    // No Upstash credentials in this environment.
    // In production this is a misconfiguration — alert once per cold start.
    const isProduction =
      process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

    if (isProduction && !warnedMisconfiguredPrefixes.has(prefix)) {
      warnedMisconfiguredPrefixes.add(prefix);
      const msg = "rate_limiting_disabled_no_redis";
      logger.error({ prefix }, msg);
      Sentry.captureMessage(`Rate limiting disabled — Upstash env not set (prefix: ${prefix})`, {
        level: "error",
      });
    }

    if (isProduction && opts.onStoreError === "deny") {
      // AI limiter with no store in production: fail closed — unmetered LLM
      // spend is worse than a blocked feature. Dev/preview stays open.
      return async () => ({ allowed: false, retryAfterSeconds: 60 });
    }

    // Degrade open: allow all calls when env is missing.
    return async () => ({ allowed: true });
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSec} s`),
    prefix,
    analytics: false,
  });

  return async (key: string): Promise<LimiterResult> => {
    try {
      const result = await limiter.limit(key);
      if (result.success) return { allowed: true };
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      };
    } catch (err) {
      // Store unreachable (DNS failure, network timeout, etc.). Log + alert,
      // then apply the limiter's store-failure policy: deny for AI spend,
      // allow for auth/CRUD so infra outages never crash those actions.
      logger.error({ err, prefix }, "ratelimit_store_error");
      Sentry.captureException(err);
      if (opts.onStoreError === "deny") {
        return { allowed: false, retryAfterSeconds: 30 };
      }
      return { allowed: true };
    }
  };
}

/**
 * Limiter for `saveProfileAction`. Profile edits are not an abuse vector
 * (no AI calls, no expensive operations) but the spec requires every Server
 * Action to be wrapped. 60 writes per minute is generous for real use.
 */
export const profileMutationLimiter = makeSlidingWindow("rl:action:profile:save", 60, 60);

/**
 * Limiter for Application Tracker mutations (create / update / delete).
 * No AI calls; cheap CRUD. 120 writes per minute is intentionally generous
 * to support rapid edits without friction.
 */
export const applicationsLimiter = makeSlidingWindow("rl:action:applications", 120, 60);

/**
 * Limiter for Relationship Manager contact mutations (create / stage change).
 * No AI calls; cheap CRUD — same budget as the application tracker.
 */
export const contactsLimiter = makeSlidingWindow("rl:action:contacts", 120, 60);

/**
 * Limiter for chatbot thread management (delete/rename). No AI calls; cheap
 * CRUD — deletes are rarer than contact edits, so a smaller budget.
 */
export const chatThreadsLimiter = makeSlidingWindow("rl:action:chat:threads", 60, 60);

/**
 * Limiter for unauthenticated auth actions (sign-in, sign-up, password reset).
 * Keyed by client IP rather than userId because these run before auth.
 *
 * 10 attempts per 60 seconds per IP is permissive for normal users but limits
 * scripted abuse. The forgot-password path is especially important to throttle
 * to prevent email-send abuse. Degrades open (R1) if the store is down — that
 * is safe because the store is currently unreachable and we must not break auth.
 */
export const authActionLimiter = makeSlidingWindow("rl:action:auth", 10, 60);

/**
 * Limiter for AI answer grading (question bank, section drills, chapter gates).
 * Every call is one Claude request, so the window is deliberately tight —
 * 20/min is faster than any human can type real answers. Fails closed on
 * store errors: unmetered Claude spend is worse than a temporarily blocked
 * grader.
 */
export const qbankGradingLimiter = makeSlidingWindow("rl:action:qbank:grade", 20, 60, {
  onStoreError: "deny",
});

/**
 * Limiter for cheap curriculum progress writes (mark read, record drill).
 * No AI calls.
 */
export const curriculumProgressLimiter = makeSlidingWindow("rl:action:curriculum", 120, 60);

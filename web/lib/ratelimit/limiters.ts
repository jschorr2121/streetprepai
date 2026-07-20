/**
 * Named rate limiters for Server Actions.
 *
 * This is one of two thin adapters over the shared sliding-window core
 * (`lib/ratelimit/core.ts`); the other is the Route Handler adapter in
 * `lib/security/rate-limit.ts`. The core owns the Redis lookup, store-error
 * policy, and result normalization — this module just declares the named
 * limiters and maps the core's result onto `LimiterResult`.
 *
 * Each limiter is a sliding-window limiter keyed by `userId` (not IP) — Server
 * Actions run after auth, so user identity is always known.
 *
 * If Upstash env is unset (local dev without Redis), limiters degrade open so
 * development is unblocked. Production must have `UPSTASH_REDIS_REST_URL` +
 * `UPSTASH_REDIS_REST_TOKEN` set.
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

import { buildLimiter, type StoreErrorMode } from "@/lib/ratelimit/core";

export type LimiterResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Thin adapter over the shared sliding-window core (`lib/ratelimit/core.ts`).
 * Server Action limiters have no in-memory fallback: in local dev without
 * Upstash they degrade open so development is unblocked; the store-error policy
 * is the only place fail-closed behavior comes from. Maps the core's normalized
 * result onto this surface's `LimiterResult` shape.
 */
function makeSlidingWindow(
  prefix: string,
  requests: number,
  windowSec: number,
  opts: { onStoreError: StoreErrorMode } = { onStoreError: "allow" },
): (key: string) => Promise<LimiterResult> {
  const check = buildLimiter(prefix, requests, windowSec, { onStoreError: opts.onStoreError });

  return async (key: string): Promise<LimiterResult> => {
    const result = await check(key);
    if (result.allowed) return { allowed: true };
    return { allowed: false, retryAfterSeconds: result.retryAfterSeconds };
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

/**
 * Limiter for the in-app feedback widget. No AI calls; cheap CRUD, but the
 * widget is reachable from every authed page, so a tight budget keeps a
 * runaway client (or a bored user mashing submit) from writing unbounded
 * rows. 5 submissions per minute is generous for real feedback.
 */
export const feedbackLimiter = makeSlidingWindow("rl:action:feedback", 5, 60);

/**
 * Limiter for self-serve account deletion. No AI calls, but irreversible and
 * destructive, so the budget is deliberately tight — a user never needs to
 * delete their account more than a handful of times a minute (retries after a
 * transient failure). Degrades open (default) if the store is down: a dead
 * Redis must not permanently trap a user in an account they want gone.
 */
export const accountDeletionLimiter = makeSlidingWindow("rl:action:account:delete", 5, 60);

/**
 * Limiter for the full-account data export. No AI calls, but each request
 * selects every row the user owns across 18 tables and buffers the JSON in
 * memory — far heavier than a normal `cheap`-tier read. A user only ever
 * needs an export occasionally, so the budget is per-hour, not per-minute.
 * Degrades open (default): a dead Redis must not block a data-rights request.
 */
export const accountExportLimiter = makeSlidingWindow("rl:route:account:export", 6, 3600);

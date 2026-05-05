import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client.
 *
 * - Lazy singleton: only constructs the client the first time `getServerPostHog()`
 *   is called and only when an API key is present.
 * - No-op when neither `POSTHOG_API_KEY` nor `NEXT_PUBLIC_POSTHOG_KEY` is set.
 *   We never log a warning in that case (no console spam in dev).
 * - Vercel-safe: configured with `flushAt: 1` and `flushInterval: 0` so events
 *   are sent immediately. Callers should still `await flushServerPostHog()`
 *   after firing events from a route handler to be sure the lambda doesn't
 *   freeze before delivery.
 *
 * PRIVACY: This module must NEVER capture PII. The event helpers in
 * `events.ts` are the only public surface and they are typed to accept
 * categorical data + UUID user IDs only.
 */

let cached: PostHog | null = null;
let initialized = false;

function resolveApiKey(): string | null {
  return process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY ?? null;
}

function resolveHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
}

export function getServerPostHog(): PostHog | null {
  if (initialized) return cached;
  initialized = true;

  const key = resolveApiKey();
  if (!key) {
    cached = null;
    return null;
  }

  cached = new PostHog(key, {
    host: resolveHost(),
    flushAt: 1,
    flushInterval: 0,
  });
  return cached;
}

/**
 * Flush queued events. Safe to call when client is unset.
 * Use after `capture()` in a route handler to ensure events
 * are delivered before the function freezes.
 */
export async function flushServerPostHog(): Promise<void> {
  const client = cached;
  if (!client) return;
  try {
    await client.flush();
  } catch {
    // Swallow — analytics must never break the request path.
  }
}

/**
 * Shut down the client and flush remaining events. Intended for
 * test teardown / graceful shutdown hooks. Routes should prefer
 * `flushServerPostHog()`.
 */
export async function shutdownServerPostHog(): Promise<void> {
  const client = cached;
  if (!client) return;
  try {
    await client.shutdown();
  } catch {
    // ignore
  } finally {
    cached = null;
    initialized = false;
  }
}

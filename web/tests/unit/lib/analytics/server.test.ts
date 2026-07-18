/**
 * Unit coverage for the server-side PostHog singleton (lib/analytics/server.ts).
 *
 * Covers:
 *  - The no-op-when-unconfigured branch: no API key -> getServerPostHog()
 *    returns null and stays null (cached), flush/shutdown are safe no-ops.
 *  - Construction + API-key fallback order when a key IS configured.
 *  - flush/shutdown plumbing against a mocked posthog-node client, including
 *    that thrown errors are swallowed (analytics must never break the request
 *    path).
 *
 * `getServerPostHog` is a lazy module-level singleton (`cached`/`initialized`
 * module state), so each test resets the module registry and re-imports to
 * get a fresh instance — otherwise the first test's outcome would leak into
 * every later test in this file.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { PostHogMock, captureMock, flushMock, shutdownMock } = vi.hoisted(() => {
  const captureMock = vi.fn();
  const flushMock = vi.fn(async () => {});
  const shutdownMock = vi.fn(async () => {});
  class PostHogMock {
    apiKey: string;
    options: unknown;
    constructor(apiKey: string, options: unknown) {
      this.apiKey = apiKey;
      this.options = options;
    }
    capture = captureMock;
    flush = flushMock;
    shutdown = shutdownMock;
  }
  return { PostHogMock, captureMock, flushMock, shutdownMock };
});

vi.mock("posthog-node", () => ({ PostHog: PostHogMock }));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.POSTHOG_API_KEY;
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  captureMock.mockClear();
  flushMock.mockClear();
  shutdownMock.mockClear();
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("getServerPostHog — unconfigured (no-op)", () => {
  it("returns null when neither POSTHOG_API_KEY nor NEXT_PUBLIC_POSTHOG_KEY is set", async () => {
    const { getServerPostHog } = await import("@/lib/analytics/server");
    expect(getServerPostHog()).toBeNull();
  });

  it("caches the null result instead of re-checking env on every call", async () => {
    const { getServerPostHog } = await import("@/lib/analytics/server");
    expect(getServerPostHog()).toBeNull();
    process.env.POSTHOG_API_KEY = "phc_added_after_first_call";
    // Still null: `initialized` was already flipped true on the first call.
    expect(getServerPostHog()).toBeNull();
  });
});

describe("getServerPostHog — configured", () => {
  it("constructs a client when POSTHOG_API_KEY is set", async () => {
    process.env.POSTHOG_API_KEY = "phc_test_key";
    const { getServerPostHog } = await import("@/lib/analytics/server");
    const client = getServerPostHog();
    expect(client).toBeInstanceOf(PostHogMock);
  });

  it("falls back to NEXT_PUBLIC_POSTHOG_KEY when POSTHOG_API_KEY is unset", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_public_key";
    const { getServerPostHog } = await import("@/lib/analytics/server");
    expect(getServerPostHog()).toBeInstanceOf(PostHogMock);
  });

  it("returns the same cached instance on repeated calls (singleton)", async () => {
    process.env.POSTHOG_API_KEY = "phc_test_key";
    const { getServerPostHog } = await import("@/lib/analytics/server");
    const first = getServerPostHog();
    const second = getServerPostHog();
    expect(first).toBe(second);
  });
});

describe("flushServerPostHog / shutdownServerPostHog", () => {
  it("are safe no-ops when no client was ever configured", async () => {
    const { getServerPostHog, flushServerPostHog, shutdownServerPostHog } =
      await import("@/lib/analytics/server");
    getServerPostHog(); // establishes the null-cached state
    await expect(flushServerPostHog()).resolves.toBeUndefined();
    await expect(shutdownServerPostHog()).resolves.toBeUndefined();
    expect(flushMock).not.toHaveBeenCalled();
    expect(shutdownMock).not.toHaveBeenCalled();
  });

  it("flushes the underlying client when configured", async () => {
    process.env.POSTHOG_API_KEY = "phc_test_key";
    const { getServerPostHog, flushServerPostHog } = await import("@/lib/analytics/server");
    getServerPostHog();
    await flushServerPostHog();
    expect(flushMock).toHaveBeenCalledTimes(1);
  });

  it("swallows flush errors instead of throwing", async () => {
    process.env.POSTHOG_API_KEY = "phc_test_key";
    flushMock.mockRejectedValueOnce(new Error("network down"));
    const { getServerPostHog, flushServerPostHog } = await import("@/lib/analytics/server");
    getServerPostHog();
    await expect(flushServerPostHog()).resolves.toBeUndefined();
  });

  it("shuts down the client, swallows errors, and resets the cache", async () => {
    process.env.POSTHOG_API_KEY = "phc_test_key";
    shutdownMock.mockRejectedValueOnce(new Error("shutdown failed"));
    const { getServerPostHog, shutdownServerPostHog } = await import("@/lib/analytics/server");
    const before = getServerPostHog();
    await expect(shutdownServerPostHog()).resolves.toBeUndefined();
    expect(shutdownMock).toHaveBeenCalledTimes(1);

    // Cache was reset — the next getServerPostHog() call constructs anew.
    const after = getServerPostHog();
    expect(after).not.toBe(before);
  });
});

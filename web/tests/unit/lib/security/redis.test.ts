import { describe, expect, it, beforeEach, vi } from "vitest";

// Mock @upstash/redis so we don't try to instantiate a real client.
const RedisMock = vi.fn().mockImplementation(function (this: object, cfg: unknown) {
  Object.assign(this, { __cfg: cfg });
});

vi.mock("@upstash/redis", () => ({
  Redis: RedisMock,
}));

describe("getRedis", () => {
  beforeEach(() => {
    vi.resetModules();
    RedisMock.mockClear();
  });

  it("returns null when UPSTASH_REDIS_REST_URL or _TOKEN is unset", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { getRedis } = await import("@/lib/security/redis");
    expect(getRedis()).toBeNull();
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("returns null when only one of url/token is set", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { getRedis } = await import("@/lib/security/redis");
    expect(getRedis()).toBeNull();
  });

  it("returns a memoized client when both env vars are set", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    const { getRedis } = await import("@/lib/security/redis");
    const a = getRedis();
    const b = getRedis();
    expect(a).not.toBeNull();
    expect(a).toBe(b);
    // Constructed exactly once thanks to memoization.
    expect(RedisMock).toHaveBeenCalledTimes(1);
    expect(RedisMock).toHaveBeenCalledWith({
      url: "https://example.upstash.io",
      token: "test-token",
    });
  });
});

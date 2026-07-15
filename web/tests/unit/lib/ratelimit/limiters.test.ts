/**
 * Store-failure policy for Server Action limiters: AI-spend limiters fail
 * closed when the Upstash store errors or is missing in production; auth and
 * CRUD limiters degrade open so infra outages never block sign-in or saves.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

describe("limiter store-failure policy", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("qbank grading limiter denies when the store errors", async () => {
    vi.doMock("@/lib/security/redis", () => ({ getRedis: vi.fn(() => ({})) }));
    vi.doMock("@upstash/ratelimit", () => {
      class Ratelimit {
        static slidingWindow = vi.fn(() => "sliding-window-config");
        limit = vi.fn().mockRejectedValue(new Error("redis down"));
      }
      return { Ratelimit };
    });

    const { qbankGradingLimiter } = await import("@/lib/ratelimit/limiters");
    const result = await qbankGradingLimiter("user-1");
    expect(result.allowed).toBe(false);
  });

  it("applications limiter degrades open when the store errors", async () => {
    vi.doMock("@/lib/security/redis", () => ({ getRedis: vi.fn(() => ({})) }));
    vi.doMock("@upstash/ratelimit", () => {
      class Ratelimit {
        static slidingWindow = vi.fn(() => "sliding-window-config");
        limit = vi.fn().mockRejectedValue(new Error("redis down"));
      }
      return { Ratelimit };
    });

    const { applicationsLimiter } = await import("@/lib/ratelimit/limiters");
    const result = await applicationsLimiter("user-1");
    expect(result.allowed).toBe(true);
  });

  it("qbank grading limiter denies in production when Upstash env is missing", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.doMock("@/lib/security/redis", () => ({ getRedis: vi.fn(() => null) }));

    const { qbankGradingLimiter } = await import("@/lib/ratelimit/limiters");
    const result = await qbankGradingLimiter("user-1");
    expect(result.allowed).toBe(false);
  });

  it("auth limiter stays open in production when Upstash env is missing", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.doMock("@/lib/security/redis", () => ({ getRedis: vi.fn(() => null) }));

    const { authActionLimiter } = await import("@/lib/ratelimit/limiters");
    const result = await authActionLimiter("1.2.3.4");
    expect(result.allowed).toBe(true);
  });

  it("qbank grading limiter allows outside production when Upstash env is missing", async () => {
    vi.doMock("@/lib/security/redis", () => ({ getRedis: vi.fn(() => null) }));

    const { qbankGradingLimiter } = await import("@/lib/ratelimit/limiters");
    const result = await qbankGradingLimiter("user-1");
    expect(result.allowed).toBe(true);
  });
});

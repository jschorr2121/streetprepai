/**
 * Upstash branch coverage for `checkRateLimit`. We mock both `@upstash/ratelimit`
 * and the local `./redis` module so the limiter constructor is observable and
 * its `.limit()` calls are scriptable.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";

const limitFn = vi.fn();
const slidingWindowFactory = vi.fn(() => ({ kind: "sliding" }));

class RatelimitMock {
  static slidingWindow = slidingWindowFactory;
  constructor(public cfg: unknown) {}
  limit = limitFn;
}

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: RatelimitMock,
}));

vi.mock("@/lib/security/redis", () => ({
  getRedis: vi.fn(() => ({ __redis: true })),
}));

function makeReq(ip = "10.0.0.1"): Request {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

beforeEach(() => {
  vi.resetModules();
  limitFn.mockReset();
  slidingWindowFactory.mockClear();
});

describe("checkRateLimit (Upstash branch)", () => {
  it("uses Upstash Ratelimit when getRedis() returns a client and allows when below cap", async () => {
    limitFn.mockResolvedValue({ success: true, reset: Date.now() + 30_000 });
    const { checkRateLimit } = await import("@/lib/security/rate-limit");

    const r = await checkRateLimit(makeReq("1.1.1.1"), "user-x", "expensive", "route/a");
    expect(r.ok).toBe(true);
    // user check + ip check = 2 limit calls
    expect(limitFn).toHaveBeenCalledTimes(2);
    expect(slidingWindowFactory).toHaveBeenCalled();
  });

  it("denies with reason='user' when the user limit fails", async () => {
    limitFn
      .mockResolvedValueOnce({ success: false, reset: Date.now() + 5_000 })
      // ip check shouldn't run, but defend against accidental ordering
      .mockResolvedValueOnce({ success: true, reset: Date.now() + 5_000 });
    const { checkRateLimit } = await import("@/lib/security/rate-limit");

    const r = await checkRateLimit(makeReq("2.2.2.2"), "user-y", "cheap", "route/b");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("user");
    expect(r.retryAfterSec).toBeGreaterThanOrEqual(0);
  });

  it("denies with reason='ip' when only the IP limit fails", async () => {
    limitFn
      .mockResolvedValueOnce({ success: true, reset: Date.now() + 5_000 }) // user pass
      .mockResolvedValueOnce({ success: false, reset: Date.now() + 8_000 }); // ip fail
    const { checkRateLimit } = await import("@/lib/security/rate-limit");

    const r = await checkRateLimit(makeReq("3.3.3.3"), "user-z", "cheap", "route/c");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("ip");
  });

  it("skips the user bucket when userId is null (public-style request)", async () => {
    limitFn.mockResolvedValue({ success: true, reset: Date.now() + 1_000 });
    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    await checkRateLimit(makeReq("4.4.4.4"), null, "public", "route/d");
    // Only IP check runs for public tier with null user.
    expect(limitFn).toHaveBeenCalledTimes(1);
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    limitFn.mockResolvedValue({ success: true, reset: Date.now() + 1_000 });
    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    const req = new Request("http://localhost/x", {
      method: "POST",
      headers: { "x-real-ip": "5.5.5.5" },
    });
    const r = await checkRateLimit(req, "user-q", "cheap", "route/e");
    expect(r.ok).toBe(true);
  });

  it("fails closed (denies) on an AI tier when the store throws", async () => {
    // AI fail-closed invariant: a Redis outage must not grant unmetered spend.
    limitFn.mockRejectedValue(new Error("redis down"));
    const { checkRateLimit } = await import("@/lib/security/rate-limit");

    const r = await checkRateLimit(makeReq("6.6.6.6"), "user-ai", "expensive", "route/ai");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("user");
  });

  it("fails open (allows) on a non-AI tier when the store throws", async () => {
    // CRUD fail-open: an infra outage must not 500 a route with no cost exposure.
    limitFn.mockRejectedValue(new Error("redis down"));
    const { checkRateLimit } = await import("@/lib/security/rate-limit");

    const r = await checkRateLimit(makeReq("7.7.7.7"), "user-crud", "cheap", "route/crud");
    expect(r.ok).toBe(true);
  });
});

describe("tooManyRequests", () => {
  it("returns a 429 with Retry-After header (>= 1)", async () => {
    const { tooManyRequests } = await import("@/lib/security/rate-limit");
    const res = tooManyRequests({ ok: false, reason: "user", retryAfterSec: 7 });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("7");
    const body = await res.json();
    expect(body.error).toBe("Too many requests");
    expect(body.reason).toBe("user");
  });

  it("clamps Retry-After to at least 1", async () => {
    const { tooManyRequests } = await import("@/lib/security/rate-limit");
    const res = tooManyRequests({ ok: false, reason: "ip", retryAfterSec: 0 });
    expect(res.headers.get("Retry-After")).toBe("1");
  });
});

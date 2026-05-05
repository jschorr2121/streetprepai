/**
 * Canary test for the in-memory rate-limit fallback. Verifies tier limits and
 * per-key isolation. Upstash branch is exercised in integration tests where
 * Redis is mocked at the network layer (not here).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// Force the in-memory branch by ensuring Upstash env vars are unset BEFORE
// the module under test reads them via getRedis().
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
});

function makeReq(ip: string): Request {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("checkRateLimit (in-memory fallback)", () => {
  it("allows requests under the cheap user limit and denies over it", async () => {
    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    const userId = "user-a";
    let allowed = 0;
    for (let i = 0; i < 30; i++) {
      const r = await checkRateLimit(makeReq("1.1.1.1"), userId, "cheap", "test/route");
      if (r.ok) allowed++;
    }
    expect(allowed).toBe(30);
    const next = await checkRateLimit(makeReq("1.1.1.1"), userId, "cheap", "test/route");
    expect(next.ok).toBe(false);
    expect(next.reason).toBe("user");
  });

  it("isolates buckets by userId", async () => {
    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    for (let i = 0; i < 30; i++) {
      await checkRateLimit(makeReq("2.2.2.2"), "user-b", "cheap", "iso");
    }
    // Different user, fresh budget
    const otherUser = await checkRateLimit(makeReq("3.3.3.3"), "user-c", "cheap", "iso");
    expect(otherUser.ok).toBe(true);
  });

  it("denies on per-IP over-limit even with new users", async () => {
    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    // Cheap IP cap = 90/min. Use rotating users so user bucket never trips.
    for (let i = 0; i < 90; i++) {
      await checkRateLimit(makeReq("9.9.9.9"), `u-${i}`, "cheap", "ip-test");
    }
    const next = await checkRateLimit(makeReq("9.9.9.9"), "u-91", "cheap", "ip-test");
    expect(next.ok).toBe(false);
    expect(next.reason).toBe("ip");
  });
});

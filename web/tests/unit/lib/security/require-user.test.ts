import { describe, expect, it, beforeEach, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";

const getUserFn = vi.fn();

vi.mock("@/lib/supabase/get-user", () => ({
  getUser: (...args: unknown[]) => getUserFn(...args),
  getUserOrNull: vi.fn(),
}));

const checkRateLimitFn = vi.fn();
vi.mock("@/lib/security/rate-limit", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return {
    ...real,
    checkRateLimit: (...args: unknown[]) => checkRateLimitFn(...args),
  };
});

const assertUnderQuotaFn = vi.fn();
vi.mock("@/lib/ai/usage", () => ({
  assertUnderQuota: (...args: unknown[]) => assertUnderQuotaFn(...args),
}));

function makeReq(): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "x-forwarded-for": "8.8.8.8" },
  });
}

beforeEach(() => {
  vi.resetModules();
  getUserFn.mockReset();
  checkRateLimitFn.mockReset();
  assertUnderQuotaFn.mockReset();
  assertUnderQuotaFn.mockResolvedValue({ ok: true, usedUsd: 0 });
});

describe("requireUser", () => {
  it("happy path: returns ok:true with user when auth + rate-limit pass", async () => {
    const u = fakeUser();
    getUserFn.mockResolvedValue(u);
    checkRateLimitFn.mockResolvedValue({ ok: true, retryAfterSec: 0 });

    const { requireUser } = await import("@/lib/security/require-user");
    const result = await requireUser(makeReq(), {
      tier: "expensive",
      route: "interview/score",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe(u.id);
    }
    expect(checkRateLimitFn).toHaveBeenCalledWith(
      expect.any(Request),
      u.id,
      "expensive",
      "interview/score",
    );
  });

  it("returns 401 Unauthorized when getUser throws", async () => {
    getUserFn.mockRejectedValue(new Error("Not authenticated"));
    const { requireUser } = await import("@/lib/security/require-user");

    const result = await requireUser(makeReq(), {
      tier: "cheap",
      route: "test/route",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body.error).toBe("Unauthorized");
    }
    expect(checkRateLimitFn).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when rate-limit denies", async () => {
    getUserFn.mockResolvedValue(fakeUser());
    checkRateLimitFn.mockResolvedValue({
      ok: false,
      reason: "user",
      retryAfterSec: 12,
    });

    const { requireUser } = await import("@/lib/security/require-user");
    const result = await requireUser(makeReq(), {
      tier: "expensive",
      route: "lens/explain",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(429);
      expect(result.response.headers.get("Retry-After")).toBe("12");
      const body = await result.response.json();
      expect(body.error).toBe("Too many requests");
      expect(body.reason).toBe("user");
    }
  });

  it("returns 429 when the monthly AI spend cap is exhausted on an AI tier", async () => {
    getUserFn.mockResolvedValue(fakeUser());
    checkRateLimitFn.mockResolvedValue({ ok: true, retryAfterSec: 0 });
    assertUnderQuotaFn.mockResolvedValue({ ok: false, usedUsd: 25 });

    const { requireUser } = await import("@/lib/security/require-user");
    const result = await requireUser(makeReq(), {
      tier: "expensive",
      route: "interview/score",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(429);
      const body = await result.response.json();
      expect(body.error).toMatch(/Monthly AI usage limit/);
    }
  });

  it("does not check the spend cap on the cheap tier by default", async () => {
    getUserFn.mockResolvedValue(fakeUser());
    checkRateLimitFn.mockResolvedValue({ ok: true, retryAfterSec: 0 });

    const { requireUser } = await import("@/lib/security/require-user");
    const result = await requireUser(makeReq(), { tier: "cheap", route: "interview/save" });
    expect(result.ok).toBe(true);
    expect(assertUnderQuotaFn).not.toHaveBeenCalled();
  });

  it("checks the spend cap on the cheap tier when spendCap is set", async () => {
    getUserFn.mockResolvedValue(fakeUser());
    checkRateLimitFn.mockResolvedValue({ ok: true, retryAfterSec: 0 });
    assertUnderQuotaFn.mockResolvedValue({ ok: false, usedUsd: 99 });

    const { requireUser } = await import("@/lib/security/require-user");
    const result = await requireUser(makeReq(), {
      tier: "cheap",
      route: "profile/extract-resume",
      spendCap: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(429);
  });
});

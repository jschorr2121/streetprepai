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
});

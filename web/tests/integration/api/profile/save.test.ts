/**
 * Integration tests for app/api/profile/save/route.ts (POST).
 *
 * Covers:
 *  - 401 unauthenticated
 *  - 400 schema rejection (wrong types, extra fields — schema is strict)
 *  - 200 happy path; upsertProfile called with (userId, validated input)
 *  - 429 after 31 requests on cheap tier (per-user limit = 30/min)
 *  - Authorization isolation: forged userId in body is rejected by strict schema
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";
import { fakeProfile } from "@/tests/fixtures/profile";

// Force in-memory rate-limit branch.
vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/get-user", () => ({
  getUser: () => getUserMock(),
  getUserOrNull: () => getUserMock().catch(() => null),
}));

const dataMocks = {
  upsertProfile: vi.fn(),
};
vi.mock("@/lib/data/profile", () => ({
  getProfile: vi.fn(),
  upsertProfile: (...a: unknown[]) => dataMocks.upsertProfile(...a),
}));

vi.mock("@/lib/analytics/events", () => ({
  trackChatStarted: vi.fn(),
  trackInterviewScored: vi.fn(),
  trackPrepGenerated: vi.fn(),
  trackResumeCritiqued: vi.fn(),
  trackAIUsage: vi.fn(),
}));
vi.mock("@/lib/logging/request-context", () => ({
  getRequestLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  }),
}));

beforeEach(() => {
  vi.resetModules();
  getUserMock.mockReset();
  dataMocks.upsertProfile.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeReq(body: unknown, ip = "10.0.0.1"): Request {
  return new Request("http://localhost/api/profile/save", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/profile/save", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/profile/save/route");
    const res = await POST(makeReq({ fullName: "Jane" }));
    expect(res.status).toBe(401);
    expect(dataMocks.upsertProfile).not.toHaveBeenCalled();
  });

  it("returns 400 on malformed body (wrong types)", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/profile/save/route");
    const res = await POST(makeReq({ graduationYear: "not-a-number" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request body");
    expect(Array.isArray(json.issues)).toBe(true);
    expect(dataMocks.upsertProfile).not.toHaveBeenCalled();
  });

  it("returns 400 when body has unknown fields (strict schema)", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/profile/save/route");
    const res = await POST(makeReq({ fullName: "Jane", maliciousField: "haxx" }));
    expect(res.status).toBe(400);
    expect(dataMocks.upsertProfile).not.toHaveBeenCalled();
  });

  it("returns 400 when nested experience is malformed", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/profile/save/route");
    const res = await POST(
      makeReq({
        experiences: [{ company: "GS", role: "SA", bullets: "should-be-array" }],
      }),
    );
    expect(res.status).toBe(400);
    expect(dataMocks.upsertProfile).not.toHaveBeenCalled();
  });

  it("upserts and returns the profile on happy path", async () => {
    const user = fakeUser();
    getUserMock.mockResolvedValue(user);
    const profile = fakeProfile({ userId: user.id, fullName: "Jane Test" });
    dataMocks.upsertProfile.mockResolvedValue(profile);
    const { POST } = await import("@/app/api/profile/save/route");
    const validInput = {
      fullName: "Jane Test",
      school: "Wharton",
      graduationYear: 2027,
      targetRoles: ["IB SA"],
      targetFirms: ["Goldman Sachs"],
      skills: ["Excel"],
    };
    const res = await POST(makeReq(validInput));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fullName).toBe("Jane Test");
    expect(dataMocks.upsertProfile).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        fullName: "Jane Test",
        school: "Wharton",
        graduationYear: 2027,
      }),
    );
  });

  it("calls upsertProfile with the authed user's id, not the request body", async () => {
    const real = fakeUser({ id: "55555555-5555-4555-8555-555555555555" });
    getUserMock.mockResolvedValue(real);
    dataMocks.upsertProfile.mockResolvedValue(fakeProfile({ userId: real.id }));
    const { POST } = await import("@/app/api/profile/save/route");
    const res = await POST(makeReq({ fullName: "Real User" }));
    expect(res.status).toBe(200);
    expect(dataMocks.upsertProfile).toHaveBeenCalledWith(
      real.id,
      expect.objectContaining({ fullName: "Real User" }),
    );
    const callUserId = dataMocks.upsertProfile.mock.calls[0]?.[0];
    expect(callUserId).toBe(real.id);
  });

  it("rejects 'userId' as an unknown field — strict schema isolates auth from body", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/profile/save/route");
    // The strict ProfileSaveSchema does not allow `userId` — forging it returns 400,
    // so it could never reach upsertProfile to override the gate's user id.
    const res = await POST(makeReq({ fullName: "Jane", userId: "forged-user-uuid" }));
    expect(res.status).toBe(400);
    expect(dataMocks.upsertProfile).not.toHaveBeenCalled();
  });

  it("returns 500 when upsertProfile throws", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    dataMocks.upsertProfile.mockRejectedValue(new Error("supabase blew up"));
    const { POST } = await import("@/app/api/profile/save/route");
    const res = await POST(makeReq({ fullName: "Jane" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("supabase blew up");
  });

  it("returns 429 after exhausting the cheap tier (31 requests)", async () => {
    const user = fakeUser({ id: "66666666-6666-4666-8666-666666666666" });
    getUserMock.mockResolvedValue(user);
    dataMocks.upsertProfile.mockResolvedValue(fakeProfile({ userId: user.id }));
    const { POST } = await import("@/app/api/profile/save/route");

    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await POST(makeReq({ fullName: "Jane" }, `203.0.113.${i}`));
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});

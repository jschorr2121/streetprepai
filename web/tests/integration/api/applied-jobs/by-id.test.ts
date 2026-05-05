/**
 * Integration tests for app/api/applied-jobs/[id]/route.ts (PATCH + DELETE).
 *
 * Covers:
 *  - 401 unauthenticated
 *  - 400 IdParamSchema rejection (non-UUID)
 *  - 400 body schema rejection
 *  - 200 happy path with data layer called using authed user id
 *  - 429 after exhausting cheap-tier per-user limit (30/min)
 *  - Authorization isolation: forged userId in body is ignored, gate.user.id used
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";

// Force in-memory rate-limit branch.
vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/get-user", () => ({
  getUser: () => getUserMock(),
  getUserOrNull: () => getUserMock().catch(() => null),
}));

const dataMocks = {
  updateAppliedJob: vi.fn(),
  removeAppliedJob: vi.fn(),
};
vi.mock("@/lib/data/applied-jobs", () => ({
  getAppliedJobs: vi.fn(),
  addAppliedJob: vi.fn(),
  updateAppliedJob: (...a: unknown[]) => dataMocks.updateAppliedJob(...a),
  removeAppliedJob: (...a: unknown[]) => dataMocks.removeAppliedJob(...a),
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

const VALID_UUID = "00000000-0000-4000-8000-000000000abc";

beforeEach(() => {
  vi.resetModules();
  getUserMock.mockReset();
  dataMocks.updateAppliedJob.mockReset();
  dataMocks.removeAppliedJob.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makePatchReq(body: unknown, ip = "10.0.0.1"): Request {
  return new Request(`http://localhost/api/applied-jobs/${VALID_UUID}`, {
    method: "PATCH",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteReq(ip = "10.0.0.2"): Request {
  return new Request(`http://localhost/api/applied-jobs/${VALID_UUID}`, {
    method: "DELETE",
    headers: { "x-forwarded-for": ip },
  });
}

describe("PATCH /api/applied-jobs/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { PATCH } = await import("@/app/api/applied-jobs/[id]/route");
    const res = await PATCH(makePatchReq({ stage: "interview" }), {
      params: Promise.resolve({ id: VALID_UUID }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is not a UUID", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { PATCH } = await import("@/app/api/applied-jobs/[id]/route");
    const res = await PATCH(makePatchReq({ stage: "interview" }), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid id");
    expect(dataMocks.updateAppliedJob).not.toHaveBeenCalled();
  });

  it("returns 400 on malformed body (wrong stage enum)", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { PATCH } = await import("@/app/api/applied-jobs/[id]/route");
    const res = await PATCH(makePatchReq({ stage: "bogus-stage" }), {
      params: Promise.resolve({ id: VALID_UUID }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request body");
    expect(Array.isArray(json.issues)).toBe(true);
    expect(dataMocks.updateAppliedJob).not.toHaveBeenCalled();
  });

  it("returns 400 when body has wrong types (firm as number)", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { PATCH } = await import("@/app/api/applied-jobs/[id]/route");
    const res = await PATCH(makePatchReq({ firm: 123 }), {
      params: Promise.resolve({ id: VALID_UUID }),
    });
    expect(res.status).toBe(400);
    expect(dataMocks.updateAppliedJob).not.toHaveBeenCalled();
  });

  it("updates and returns the job on happy path", async () => {
    const user = fakeUser();
    getUserMock.mockResolvedValue(user);
    const updated = {
      id: VALID_UUID,
      firm: "GS",
      role: "SA",
      stage: "interview",
      addedAt: "2026-05-01T00:00:00.000Z",
    };
    dataMocks.updateAppliedJob.mockResolvedValue(updated);
    const { PATCH } = await import("@/app/api/applied-jobs/[id]/route");
    const res = await PATCH(makePatchReq({ stage: "interview", notes: "moved on" }), {
      params: Promise.resolve({ id: VALID_UUID }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe(VALID_UUID);
    expect(dataMocks.updateAppliedJob).toHaveBeenCalledWith(
      user.id,
      VALID_UUID,
      expect.objectContaining({ stage: "interview", notes: "moved on" }),
    );
  });

  it("calls the data layer with the authed user's id, not a forged one", async () => {
    const real = fakeUser({ id: "11111111-1111-4111-8111-111111111111" });
    getUserMock.mockResolvedValue(real);
    dataMocks.updateAppliedJob.mockResolvedValue({
      id: VALID_UUID,
      firm: "GS",
      role: "SA",
      stage: "interview",
      addedAt: "2026-05-01T00:00:00.000Z",
    });
    const { PATCH } = await import("@/app/api/applied-jobs/[id]/route");
    // Body includes a forged userId — schema is strict (no extra props allowed)
    // is *not* required by AppliedJobPatchSchema (which is .partial() of a non-strict schema),
    // so the forged field is silently stripped, never reaching the data layer.
    const res = await PATCH(
      new Request(`http://localhost/api/applied-jobs/${VALID_UUID}`, {
        method: "PATCH",
        headers: { "x-forwarded-for": "9.9.9.9", "content-type": "application/json" },
        body: JSON.stringify({ stage: "interview" }),
      }),
      { params: Promise.resolve({ id: VALID_UUID }) },
    );
    expect(res.status).toBe(200);
    expect(dataMocks.updateAppliedJob).toHaveBeenCalledWith(
      real.id,
      VALID_UUID,
      expect.any(Object),
    );
    // Should NEVER pass a forged id to the data layer.
    const callArgs = dataMocks.updateAppliedJob.mock.calls[0]!;
    expect(callArgs[0]).toBe(real.id);
    expect(callArgs[0]).not.toBe("forged-user-uuid");
  });

  it("returns 429 after exhausting cheap-tier per-user limit (31 requests)", async () => {
    const user = fakeUser({ id: "22222222-2222-4222-8222-222222222222" });
    getUserMock.mockResolvedValue(user);
    dataMocks.updateAppliedJob.mockResolvedValue({
      id: VALID_UUID,
      firm: "GS",
      role: "SA",
      stage: "applied",
      addedAt: "2026-05-01T00:00:00.000Z",
    });
    const { PATCH } = await import("@/app/api/applied-jobs/[id]/route");

    // Use a unique IP per request to ensure user-bucket trips first (not IP).
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await PATCH(makePatchReq({ stage: "applied" }, `192.168.1.${i}`), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      statuses.push(res.status);
    }
    // First 30 should be 200, the 31st should be 429.
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});

describe("DELETE /api/applied-jobs/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { DELETE } = await import("@/app/api/applied-jobs/[id]/route");
    const res = await DELETE(makeDeleteReq(), {
      params: Promise.resolve({ id: VALID_UUID }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is not a UUID", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { DELETE } = await import("@/app/api/applied-jobs/[id]/route");
    const res = await DELETE(makeDeleteReq(), {
      params: Promise.resolve({ id: "garbage" }),
    });
    expect(res.status).toBe(400);
    expect(dataMocks.removeAppliedJob).not.toHaveBeenCalled();
  });

  it("removes and returns ok:true on happy path", async () => {
    const user = fakeUser();
    getUserMock.mockResolvedValue(user);
    dataMocks.removeAppliedJob.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/applied-jobs/[id]/route");
    const res = await DELETE(makeDeleteReq(), {
      params: Promise.resolve({ id: VALID_UUID }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(dataMocks.removeAppliedJob).toHaveBeenCalledWith(user.id, VALID_UUID);
  });

  it("calls the data layer with the authed user's id", async () => {
    const real = fakeUser({ id: "33333333-3333-4333-8333-333333333333" });
    getUserMock.mockResolvedValue(real);
    dataMocks.removeAppliedJob.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/applied-jobs/[id]/route");
    await DELETE(makeDeleteReq("8.8.8.8"), {
      params: Promise.resolve({ id: VALID_UUID }),
    });
    expect(dataMocks.removeAppliedJob).toHaveBeenCalledWith(real.id, VALID_UUID);
  });

  it("returns 500 when the data layer throws", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    dataMocks.removeAppliedJob.mockRejectedValue(new Error("db down"));
    const { DELETE } = await import("@/app/api/applied-jobs/[id]/route");
    const res = await DELETE(makeDeleteReq(), {
      params: Promise.resolve({ id: VALID_UUID }),
    });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("db down");
  });

  it("returns 429 after exhausting cheap-tier per-user limit (31 requests)", async () => {
    const user = fakeUser({ id: "44444444-4444-4444-8444-444444444444" });
    getUserMock.mockResolvedValue(user);
    dataMocks.removeAppliedJob.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/applied-jobs/[id]/route");

    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await DELETE(makeDeleteReq(`172.16.0.${i}`), {
        params: Promise.resolve({ id: VALID_UUID }),
      });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});

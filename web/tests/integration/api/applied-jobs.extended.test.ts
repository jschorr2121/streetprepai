/**
 * Extended integration tests for app/api/applied-jobs/route.ts (POST + GET).
 * Augments the canary at applied-jobs.test.ts (do NOT delete that file).
 *
 * Adds:
 *  - 429 rate-limit on POST (cheap tier — 30/user/min)
 *  - 429 rate-limit on GET
 *  - Validation edges: empty firm, role too long, invalid stage, invalid url
 *  - Schema strips unknown fields and POST never uses a forged userId
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
  addAppliedJob: vi.fn(),
  getAppliedJobs: vi.fn(),
};
vi.mock("@/lib/data/applied-jobs", () => ({
  addAppliedJob: (...a: unknown[]) => dataMocks.addAppliedJob(...a),
  getAppliedJobs: (...a: unknown[]) => dataMocks.getAppliedJobs(...a),
  updateAppliedJob: vi.fn(),
  removeAppliedJob: vi.fn(),
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
  dataMocks.addAppliedJob.mockReset();
  dataMocks.getAppliedJobs.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makePost(body: unknown, ip = "10.0.0.1"): Request {
  return new Request("http://localhost/api/applied-jobs", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGet(ip = "10.0.0.1"): Request {
  return new Request("http://localhost/api/applied-jobs", {
    method: "GET",
    headers: { "x-forwarded-for": ip },
  });
}

describe("POST /api/applied-jobs — extended validation", () => {
  it("returns 400 when firm is empty after trim", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/applied-jobs/route");
    const res = await POST(makePost({ firm: "   ", role: "SA", stage: "applied" }));
    expect(res.status).toBe(400);
    expect(dataMocks.addAppliedJob).not.toHaveBeenCalled();
  });

  it("returns 400 when role exceeds max length", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/applied-jobs/route");
    const longRole = "x".repeat(200);
    const res = await POST(makePost({ firm: "GS", role: longRole, stage: "applied" }));
    expect(res.status).toBe(400);
    expect(dataMocks.addAppliedJob).not.toHaveBeenCalled();
  });

  it("returns 400 when stage is not in the enum", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/applied-jobs/route");
    const res = await POST(makePost({ firm: "GS", role: "SA", stage: "ghosted" }));
    expect(res.status).toBe(400);
    expect(dataMocks.addAppliedJob).not.toHaveBeenCalled();
  });

  it("returns 400 when url is not a valid URL", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/applied-jobs/route");
    const res = await POST(
      makePost({
        firm: "GS",
        role: "SA",
        stage: "applied",
        url: "not a url",
      }),
    );
    expect(res.status).toBe(400);
    expect(dataMocks.addAppliedJob).not.toHaveBeenCalled();
  });
});

describe("POST /api/applied-jobs — rate limit", () => {
  it("returns 429 after exhausting cheap-tier per-user limit (31 requests)", async () => {
    const user = fakeUser({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
    getUserMock.mockResolvedValue(user);
    dataMocks.addAppliedJob.mockResolvedValue({
      id: "j1",
      firm: "GS",
      role: "SA",
      stage: "applied",
      addedAt: "2026-05-01T00:00:00.000Z",
    });
    const { POST } = await import("@/app/api/applied-jobs/route");

    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await POST(makePost({ firm: "GS", role: "SA", stage: "applied" }, `1.2.3.${i}`));
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });

  it("includes Retry-After header on 429", async () => {
    const user = fakeUser({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });
    getUserMock.mockResolvedValue(user);
    dataMocks.addAppliedJob.mockResolvedValue({
      id: "j1",
      firm: "GS",
      role: "SA",
      stage: "applied",
      addedAt: "2026-05-01T00:00:00.000Z",
    });
    const { POST } = await import("@/app/api/applied-jobs/route");

    let lastRes: Response | undefined;
    for (let i = 0; i < 31; i++) {
      lastRes = await POST(makePost({ firm: "GS", role: "SA", stage: "applied" }, `4.5.6.${i}`));
    }
    expect(lastRes!.status).toBe(429);
    expect(lastRes!.headers.get("Retry-After")).toMatch(/^\d+$/);
  });
});

describe("GET /api/applied-jobs — rate limit", () => {
  it("returns 429 after exhausting cheap-tier per-user limit (31 requests)", async () => {
    const user = fakeUser({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" });
    getUserMock.mockResolvedValue(user);
    dataMocks.getAppliedJobs.mockResolvedValue([]);
    const { GET } = await import("@/app/api/applied-jobs/route");

    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await GET(makeGet(`7.8.9.${i}`));
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});

describe("POST /api/applied-jobs — authorization isolation", () => {
  it("uses gate.user.id, ignoring any forged 'userId' field stripped by schema", async () => {
    const real = fakeUser({ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" });
    getUserMock.mockResolvedValue(real);
    dataMocks.addAppliedJob.mockResolvedValue({
      id: "j-real",
      firm: "GS",
      role: "SA",
      stage: "applied",
      addedAt: "2026-05-01T00:00:00.000Z",
    });
    const { POST } = await import("@/app/api/applied-jobs/route");
    const res = await POST(
      makePost({
        firm: "GS",
        role: "SA",
        stage: "applied",
        // Forged userId — AppliedJobInputSchema is non-strict so unknown fields are
        // silently stripped, but they MUST NOT be passed to the data layer.
        userId: "forged-user-uuid",
      }),
    );
    expect(res.status).toBe(200);
    const callArgs = dataMocks.addAppliedJob.mock.calls[0]!;
    expect(callArgs[0]).toBe(real.id);
    // Validated input passed at index 1 — should not contain the forged userId.
    expect(callArgs[1]).not.toHaveProperty("userId");
  });
});

/**
 * Canary integration test. Proves that:
 *  - requireUser blocks unauthenticated calls (401)
 *  - parseJson blocks malformed bodies (400)
 *  - Happy path returns the inserted job
 *
 * Mocking strategy: we mock `lib/supabase/get-user` and the data layer at the
 * module boundary, NOT at the network layer. This is faster and avoids reasoning
 * about Supabase's REST shape in tests.
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

const addAppliedJobMock = vi.fn();
const getAppliedJobsMock = vi.fn();
vi.mock("@/lib/data/applied-jobs", () => ({
  addAppliedJob: (...args: unknown[]) => addAppliedJobMock(...args),
  getAppliedJobs: (...args: unknown[]) => getAppliedJobsMock(...args),
  updateAppliedJob: vi.fn(),
  removeAppliedJob: vi.fn(),
}));

beforeEach(() => {
  getUserMock.mockReset();
  addAppliedJobMock.mockReset();
  getAppliedJobsMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/applied-jobs", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/applied-jobs/route");
    const res = await POST(
      new Request("http://localhost/api/applied-jobs", {
        method: "POST",
        body: JSON.stringify({ firm: "GS", role: "SA", stage: "applied" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed body", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/applied-jobs/route");
    const res = await POST(
      new Request("http://localhost/api/applied-jobs", {
        method: "POST",
        body: JSON.stringify({ firm: "" }),
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request body");
    expect(Array.isArray(json.issues)).toBe(true);
  });

  it("inserts and returns the job on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    addAppliedJobMock.mockResolvedValue({
      id: "j1",
      firm: "GS",
      role: "SA",
      stage: "applied",
      addedAt: "2026-05-01T00:00:00.000Z",
    });
    const { POST } = await import("@/app/api/applied-jobs/route");
    const res = await POST(
      new Request("http://localhost/api/applied-jobs", {
        method: "POST",
        body: JSON.stringify({ firm: "GS", role: "SA", stage: "applied" }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("j1");
    expect(addAppliedJobMock).toHaveBeenCalledWith(
      fakeUser().id,
      expect.objectContaining({ firm: "GS", role: "SA", stage: "applied" }),
    );
  });
});

describe("GET /api/applied-jobs", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { GET } = await import("@/app/api/applied-jobs/route");
    const res = await GET(new Request("http://localhost/api/applied-jobs"));
    expect(res.status).toBe(401);
  });

  it("returns the user's jobs on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    getAppliedJobsMock.mockResolvedValue([{ id: "j1" }, { id: "j2" }]);
    const { GET } = await import("@/app/api/applied-jobs/route");
    const res = await GET(new Request("http://localhost/api/applied-jobs"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.jobs).toHaveLength(2);
    expect(getAppliedJobsMock).toHaveBeenCalledWith(fakeUser().id);
  });
});

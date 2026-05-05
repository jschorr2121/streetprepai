/**
 * Integration tests for app/api/interview/save/route.ts (POST).
 *
 * Covers:
 *  - 401 unauthenticated
 *  - 400 schema rejection (missing required questionText, bad mode, malformed nested)
 *  - 200 happy path with full nested audioMetrics + scorecard
 *  - 429 after 31 requests on cheap tier
 *  - Authorization isolation: saveMockInterview called with gate.user.id
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
  saveMockInterview: vi.fn(),
};
vi.mock("@/lib/data/mock-interviews", () => ({
  getMockInterviews: vi.fn(),
  saveMockInterview: (...a: unknown[]) => dataMocks.saveMockInterview(...a),
  deleteMockInterview: vi.fn(),
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
  dataMocks.saveMockInterview.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeReq(body: unknown, ip = "10.0.0.1"): Request {
  return new Request("http://localhost/api/interview/save", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Matches lib/validation/schemas/interview.ts ScorecardSchema.
function validScorecard() {
  return {
    content_score: 70,
    delivery_score: 75,
    rubric: [
      { dimension: "structure", score: 70, comment: "linear walkthrough" },
      { dimension: "depth", score: 75, comment: "covered WACC well" },
    ],
    strengths: ["clear intro", "calm pace"],
    improvements: ["explain terminal value", "tighter close"],
    follow_up_questions: ["What's the biggest sensitivity?"],
    model_answer: "A DCF projects FCF, discounts at WACC, adds terminal value.",
  };
}

function validAudioMetrics() {
  return {
    wpm: 150,
    fillerCount: 4,
    pauseRatio: 0.12,
    longestPauseMs: 1500,
    totalSpeakingMs: 90_000,
  };
}

function validBody() {
  return {
    questionText: "Walk me through a DCF.",
    mode: "technical" as const,
    transcript: "A DCF starts with projecting unlevered free cash flows...",
    scorecard: validScorecard(),
    audioMetrics: validAudioMetrics(),
    durationSeconds: 90,
  };
}

describe("POST /api/interview/save", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/interview/save/route");
    const res = await POST(makeReq(validBody()));
    expect(res.status).toBe(401);
    expect(dataMocks.saveMockInterview).not.toHaveBeenCalled();
  });

  it("returns 400 when required questionText is missing", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/interview/save/route");
    const body = validBody() as Record<string, unknown>;
    delete body.questionText;
    const res = await POST(makeReq(body));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request body");
    expect(Array.isArray(json.issues)).toBe(true);
    expect(dataMocks.saveMockInterview).not.toHaveBeenCalled();
  });

  it("returns 400 when mode is not in the enum", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/interview/save/route");
    const res = await POST(makeReq({ ...validBody(), mode: "not-a-mode" }));
    expect(res.status).toBe(400);
    expect(dataMocks.saveMockInterview).not.toHaveBeenCalled();
  });

  it("returns 400 when audioMetrics has out-of-range pauseRatio", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/interview/save/route");
    const bad = {
      ...validBody(),
      audioMetrics: { ...validAudioMetrics(), pauseRatio: 1.5 },
    };
    const res = await POST(makeReq(bad));
    expect(res.status).toBe(400);
    expect(dataMocks.saveMockInterview).not.toHaveBeenCalled();
  });

  it("returns 400 when scorecard is missing required fields", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/interview/save/route");
    const bad = {
      ...validBody(),
      scorecard: { content_score: 70 }, // missing everything else
    };
    const res = await POST(makeReq(bad));
    expect(res.status).toBe(400);
    expect(dataMocks.saveMockInterview).not.toHaveBeenCalled();
  });

  it("returns 400 when body has unknown fields (strict schema)", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    const { POST } = await import("@/app/api/interview/save/route");
    const res = await POST(makeReq({ ...validBody(), maliciousField: "haxx" }));
    expect(res.status).toBe(400);
    expect(dataMocks.saveMockInterview).not.toHaveBeenCalled();
  });

  it("saves and returns the interview on happy path", async () => {
    const user = fakeUser();
    getUserMock.mockResolvedValue(user);
    const saved = {
      id: "mi-1",
      ...validBody(),
      createdAt: "2026-05-01T00:00:00.000Z",
    };
    dataMocks.saveMockInterview.mockResolvedValue(saved);
    const { POST } = await import("@/app/api/interview/save/route");
    const res = await POST(makeReq(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("mi-1");
    expect(dataMocks.saveMockInterview).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        questionText: "Walk me through a DCF.",
        mode: "technical",
        scorecard: expect.objectContaining({
          content_score: 70,
          delivery_score: 75,
        }),
        audioMetrics: expect.objectContaining({ wpm: 150 }),
      }),
    );
  });

  it("calls saveMockInterview with the authed user's id", async () => {
    const real = fakeUser({ id: "77777777-7777-4777-8777-777777777777" });
    getUserMock.mockResolvedValue(real);
    dataMocks.saveMockInterview.mockResolvedValue({
      id: "mi-1",
      ...validBody(),
      createdAt: "2026-05-01T00:00:00.000Z",
    });
    const { POST } = await import("@/app/api/interview/save/route");
    await POST(makeReq(validBody()));
    const callUserId = dataMocks.saveMockInterview.mock.calls[0]?.[0];
    expect(callUserId).toBe(real.id);
  });

  it("returns 500 when saveMockInterview throws", async () => {
    getUserMock.mockResolvedValue(fakeUser());
    dataMocks.saveMockInterview.mockRejectedValue(new Error("db down"));
    const { POST } = await import("@/app/api/interview/save/route");
    const res = await POST(makeReq(validBody()));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("db down");
  });

  it("returns 429 after exhausting cheap-tier per-user limit (31 requests)", async () => {
    const user = fakeUser({ id: "88888888-8888-4888-8888-888888888888" });
    getUserMock.mockResolvedValue(user);
    dataMocks.saveMockInterview.mockResolvedValue({
      id: "mi-1",
      ...validBody(),
      createdAt: "2026-05-01T00:00:00.000Z",
    });
    const { POST } = await import("@/app/api/interview/save/route");

    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await POST(makeReq(validBody(), `198.51.100.${i}`));
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});

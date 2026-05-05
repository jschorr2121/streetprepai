/**
 * Integration tests for POST /api/interview/score — Anthropic tool_use scoring.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";

vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/get-user", () => ({
  getUser: () => getUserMock(),
  getUserOrNull: () => getUserMock().catch(() => null),
}));

vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropic: () => ({
    messages: {
      stream: vi.fn(),
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            id: "tu_1",
            name: "save_scorecard",
            input: {
              content_score: 72,
              delivery_score: 80,
              rubric: [
                { dimension: "Accuracy", score: 70, comment: "good" },
                { dimension: "Structure", score: 75, comment: "ok" },
                { dimension: "Specificity", score: 70, comment: "fine" },
              ],
              strengths: ["clear", "calm"],
              improvements: ["tighten close", "explain WACC"],
              follow_up_questions: ["q1", "q2", "q3"],
              model_answer: "Banker-speak answer here.",
            },
          },
        ],
        model: "claude-opus-4-7",
        usage: { input_tokens: 10, output_tokens: 5 },
        stop_reason: "tool_use",
      }),
    },
  }),
  MODELS: {
    opus: "claude-opus-4-7",
    sonnet: "claude-sonnet-4-6",
    haiku: "claude-haiku-4-5-20251001",
  },
}));

vi.mock("@/lib/ai/usage", () => ({
  logUsage: vi.fn(),
  trackStream: vi.fn(),
  getUserUsageThisMonth: vi.fn().mockResolvedValue({ totalUsd: 0, rowCount: 0 }),
  assertUnderQuota: vi.fn().mockResolvedValue({ ok: true, usedUsd: 0 }),
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
    child: () => ({ info: vi.fn() }),
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
});

const validBody = {
  question: "Walk me through a DCF.",
  mode: "technical" as const,
  transcript: "A DCF projects future cash flows and discounts them back to today.",
  audioMetrics: {
    wpm: 140,
    fillerCount: 3,
    pauseRatio: 0.12,
    longestPauseMs: 1200,
    totalSpeakingMs: 30000,
  },
};

describe("POST /api/interview/score", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/interview/score/route");
    const res = await POST(
      new Request("http://localhost/api/interview/score", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "12.0.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed body", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-score-bad" }));
    const { POST } = await import("@/app/api/interview/score/route");
    const res = await POST(
      new Request("http://localhost/api/interview/score", {
        method: "POST",
        body: JSON.stringify({ question: "hi" }),
        headers: { "x-forwarded-for": "12.0.0.2", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns scorecard JSON on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-score-ok" }));
    const { POST } = await import("@/app/api/interview/score/route");
    const res = await POST(
      new Request("http://localhost/api/interview/score", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "12.0.0.3", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.content_score).toBe(72);
    expect(json.delivery_score).toBe(80);
    expect(Array.isArray(json.rubric)).toBe(true);
    expect(json.rubric).toHaveLength(3);
  });

  it("returns 429 after exhausting per-user budget", async () => {
    const userId = "u-score-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/interview/score/route");
    for (let i = 0; i < 10; i++) {
      const res = await POST(
        new Request("http://localhost/api/interview/score", {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "x-forwarded-for": `12.1.${i}.1`, "Content-Type": "application/json" },
        }),
      );
      expect([200, 502]).toContain(res.status);
    }
    const denied = await POST(
      new Request("http://localhost/api/interview/score", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "12.1.99.99", "Content-Type": "application/json" },
      }),
    );
    expect(denied.status).toBe(429);
  });
});

/**
 * Integration tests for POST /api/resume/critique — Anthropic tool_use critique.
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
            name: "critique_resume",
            input: {
              score: 65,
              top_priorities: [
                { original: "Built X", why_weak: "vague", rewrite: "Built X delivering Y" },
              ],
              sections: [
                {
                  heading: "Experience",
                  bullets: [
                    {
                      id: "experience-1",
                      original: "Built X",
                      critique: "vague",
                      rewritten: "Built X delivering Y",
                      confidence: "high",
                    },
                  ],
                },
              ],
              add: ["Skills section"],
              cut: ["dated highschool stuff"],
              overall: "Solid but vague.",
              summary: { total_bullets: 1, weak_bullets: 1 },
            },
          },
        ],
        model: "claude-sonnet-4-6",
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

const validBody = { rawText: "Wharton 2027. GS TMT off-cycle 2025. Built X." };

describe("POST /api/resume/critique", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/resume/critique/route");
    const res = await POST(
      new Request("http://localhost/api/resume/critique", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "17.0.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed body", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-rc-bad" }));
    const { POST } = await import("@/app/api/resume/critique/route");
    const res = await POST(
      new Request("http://localhost/api/resume/critique", {
        method: "POST",
        body: JSON.stringify({ rawText: "" }),
        headers: { "x-forwarded-for": "17.0.0.2", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns critique JSON on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-rc-ok" }));
    const { POST } = await import("@/app/api/resume/critique/route");
    const res = await POST(
      new Request("http://localhost/api/resume/critique", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "17.0.0.3", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.score).toBe(65);
    expect(Array.isArray(json.sections)).toBe(true);
    expect(json.summary.total_bullets).toBe(1);
  });

  it("returns 429 after exhausting per-user budget", async () => {
    const userId = "u-rc-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/resume/critique/route");
    for (let i = 0; i < 10; i++) {
      const res = await POST(
        new Request("http://localhost/api/resume/critique", {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "x-forwarded-for": `17.1.${i}.1`, "Content-Type": "application/json" },
        }),
      );
      expect([200, 502]).toContain(res.status);
    }
    const denied = await POST(
      new Request("http://localhost/api/resume/critique", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "17.1.99.99", "Content-Type": "application/json" },
      }),
    );
    expect(denied.status).toBe(429);
  });
});

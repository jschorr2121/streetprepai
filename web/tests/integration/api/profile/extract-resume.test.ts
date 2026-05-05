/**
 * Integration tests for POST /api/profile/extract-resume — OpenAI structured extraction.
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

const structuredJson = JSON.stringify({
  experiences: [
    {
      company: "Goldman Sachs",
      role: "Off-cycle Analyst",
      startDate: "2025",
      endDate: "2025",
      location: "New York",
      bullets: ["Built X", "Led Y"],
    },
  ],
  education: [
    { school: "Wharton", degree: "BS", field: "Finance", graduationYear: 2027, gpa: 3.8 },
  ],
  skills: ["Excel"],
  suggestedBioSummary: "Junior at Wharton.",
});

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            { message: { role: "assistant", content: structuredJson }, finish_reason: "stop" },
          ],
          model: "gpt-5.4-nano",
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      },
    },
  }),
  OPENAI_MODELS: { nano: "gpt-5.4-nano" },
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

const validBody = { rawText: "Wharton 2027. GS TMT off-cycle 2025." };

describe("POST /api/profile/extract-resume", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/profile/extract-resume/route");
    const res = await POST(
      new Request("http://localhost/api/profile/extract-resume", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "23.0.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed body", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-er-bad" }));
    const { POST } = await import("@/app/api/profile/extract-resume/route");
    const res = await POST(
      new Request("http://localhost/api/profile/extract-resume", {
        method: "POST",
        body: JSON.stringify({ rawText: "" }),
        headers: { "x-forwarded-for": "23.0.0.2", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns structured profile JSON on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-er-ok" }));
    const { POST } = await import("@/app/api/profile/extract-resume/route");
    const res = await POST(
      new Request("http://localhost/api/profile/extract-resume", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "23.0.0.3", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.experiences)).toBe(true);
    expect(json.experiences[0].company).toBe("Goldman Sachs");
    expect(json.suggestedBioSummary).toBe("Junior at Wharton.");
  });

  it("returns 429 after exhausting per-user cheap budget", async () => {
    const userId = "u-er-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/profile/extract-resume/route");
    // cheap → 30/min/user
    for (let i = 0; i < 30; i++) {
      const res = await POST(
        new Request("http://localhost/api/profile/extract-resume", {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "x-forwarded-for": `23.1.${i}.1`, "Content-Type": "application/json" },
        }),
      );
      expect([200, 500]).toContain(res.status);
    }
    const denied = await POST(
      new Request("http://localhost/api/profile/extract-resume", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "23.1.99.99", "Content-Type": "application/json" },
      }),
    );
    expect(denied.status).toBe(429);
  });
});

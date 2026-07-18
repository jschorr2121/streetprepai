/**
 * Integration tests for POST /api/relationships/draft-followup — Anthropic plain text.
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

const createMock = vi.fn().mockResolvedValue({
  content: [
    {
      type: "text",
      text: "Subject: Thanks for the chat\n\nHi Alex,\n\nThanks again for taking the time...",
    },
  ],
  model: "claude-haiku-4-5-20251001",
  usage: { input_tokens: 10, output_tokens: 5 },
  stop_reason: "end_turn",
});

vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropic: () => ({
    messages: {
      stream: vi.fn(),
      create: (...args: unknown[]) => createMock(...args),
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
  contactName: "Alex Chen",
  contactFirm: "Goldman Sachs",
  contactTitle: "VP",
  summary: {
    topics: ["TMT deal flow"],
    adviceGiven: ["read M&I"],
    commitments: [],
    personalDetails: [],
  },
};

describe("POST /api/relationships/draft-followup", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/relationships/draft-followup/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/draft-followup", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "21.0.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed body", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-df-bad" }));
    const { POST } = await import("@/app/api/relationships/draft-followup/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/draft-followup", {
        method: "POST",
        body: JSON.stringify({ contactName: "" }),
        headers: { "x-forwarded-for": "21.0.0.2", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns subject + body JSON on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-df-ok" }));
    const { POST } = await import("@/app/api/relationships/draft-followup/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/draft-followup", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "21.0.0.3", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.subject).toBe("Thanks for the chat");
    expect(typeof json.body).toBe("string");
    expect(json.body).toContain("Hi Alex");
  });

  it("returns 502 and logs server-side when the Anthropic call throws", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-df-throw" }));
    createMock.mockRejectedValueOnce(new Error("upstream boom"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { POST } = await import("@/app/api/relationships/draft-followup/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/draft-followup", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "21.2.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(typeof json.error).toBe("string");
    expect(json.error).not.toContain("upstream boom");
    expect(errorSpy).toHaveBeenCalledWith("[relationships/draft-followup]", expect.any(Error));
    errorSpy.mockRestore();
  });

  it("returns 429 after exhausting per-user budget", async () => {
    const userId = "u-df-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/relationships/draft-followup/route");
    for (let i = 0; i < 10; i++) {
      const res = await POST(
        new Request("http://localhost/api/relationships/draft-followup", {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "x-forwarded-for": `21.1.${i}.1`, "Content-Type": "application/json" },
        }),
      );
      expect([200, 502]).toContain(res.status);
    }
    const denied = await POST(
      new Request("http://localhost/api/relationships/draft-followup", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "21.1.99.99", "Content-Type": "application/json" },
      }),
    );
    expect(denied.status).toBe(429);
  });
});

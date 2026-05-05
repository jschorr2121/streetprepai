/**
 * Integration tests for POST /api/chat/stream — Anthropic streaming chat.
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
      stream: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "mocked " } };
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "response" } };
        },
        finalMessage: async () => ({
          model: "claude-sonnet-4-6",
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      }),
      create: vi.fn(),
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
  guideTitle: "DCF Fundamentals",
  guideContent: "DCF projects future cash flows discounted to today.",
  messages: [{ role: "user" as const, content: "what is WACC?" }],
};

describe("POST /api/chat/stream", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/chat/stream/route");
    const res = await POST(
      new Request("http://localhost/api/chat/stream", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "10.0.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed body", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-stream-bad" }));
    const { POST } = await import("@/app/api/chat/stream/route");
    const res = await POST(
      new Request("http://localhost/api/chat/stream", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
        headers: { "x-forwarded-for": "10.0.0.2", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("streams text on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-stream-ok" }));
    const { POST } = await import("@/app/api/chat/stream/route");
    const res = await POST(
      new Request("http://localhost/api/chat/stream", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "10.0.0.3", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let body = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      body += decoder.decode(value);
    }
    expect(body).toContain("mocked");
  });

  it("returns 429 after exhausting per-user budget", async () => {
    const userId = "u-stream-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/chat/stream/route");
    // expensive tier → 10/min/user. Vary IP to avoid hitting 30/min IP cap.
    for (let i = 0; i < 10; i++) {
      const res = await POST(
        new Request("http://localhost/api/chat/stream", {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "x-forwarded-for": `10.1.${i}.1`, "Content-Type": "application/json" },
        }),
      );
      // drain body to free the stream
      if (res.body) {
        const reader = res.body.getReader();
        while (true) {
          const r = await reader.read();
          if (r.done) break;
        }
      }
      expect([200, 502]).toContain(res.status);
    }
    const denied = await POST(
      new Request("http://localhost/api/chat/stream", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "10.1.99.99", "Content-Type": "application/json" },
      }),
    );
    expect(denied.status).toBe(429);
  });
});

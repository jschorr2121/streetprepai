/**
 * Integration tests for POST /api/relationships/structure-chat — Anthropic tool_use.
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

// clientSafeError (lib/security/client-error.ts) logs through the shared pino
// logger rather than raw console.error.
const loggerErrorMock = vi.fn();
vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: loggerErrorMock, debug: vi.fn() },
}));

const createMock = vi.fn().mockResolvedValue({
  content: [
    {
      type: "tool_use",
      id: "tu_1",
      name: "save_chat_summary",
      input: {
        topics: ["TMT deal flow"],
        adviceGiven: ["read M&I"],
        commitments: ["intro to summer analyst"],
        personalDetails: ["from Boston"],
        followUps: [{ description: "send thank-you", dueBy: "2026-04-17" }],
      },
    },
  ],
  model: "claude-sonnet-4-6",
  usage: { input_tokens: 10, output_tokens: 5 },
  stop_reason: "tool_use",
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
  rawNotes: "We talked about TMT deal flow. Alex offered to intro me to a summer analyst.",
};

describe("POST /api/relationships/structure-chat", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/relationships/structure-chat/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/structure-chat", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "22.0.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed body", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-sc-bad" }));
    const { POST } = await import("@/app/api/relationships/structure-chat/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/structure-chat", {
        method: "POST",
        body: JSON.stringify({ contactName: "" }),
        headers: { "x-forwarded-for": "22.0.0.2", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns structured summary JSON on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-sc-ok" }));
    const { POST } = await import("@/app/api/relationships/structure-chat/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/structure-chat", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "22.0.0.3", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.topics)).toBe(true);
    expect(Array.isArray(json.followUps)).toBe(true);
  });

  it("returns 502 and logs server-side when the Anthropic call throws", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-sc-throw" }));
    createMock.mockRejectedValueOnce(new Error("upstream boom"));
    const { POST } = await import("@/app/api/relationships/structure-chat/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/structure-chat", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "22.2.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(typeof json.error).toBe("string");
    expect(json.error).not.toContain("upstream boom");
    expect(loggerErrorMock).toHaveBeenCalledWith(
      { route: "relationships/structure-chat", err: expect.any(Error) },
      "route_error",
    );
  });

  it("returns 429 after exhausting per-user budget", async () => {
    const userId = "u-sc-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/relationships/structure-chat/route");
    for (let i = 0; i < 10; i++) {
      const res = await POST(
        new Request("http://localhost/api/relationships/structure-chat", {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "x-forwarded-for": `22.1.${i}.1`, "Content-Type": "application/json" },
        }),
      );
      expect([200, 502]).toContain(res.status);
    }
    const denied = await POST(
      new Request("http://localhost/api/relationships/structure-chat", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "22.1.99.99", "Content-Type": "application/json" },
      }),
    );
    expect(denied.status).toBe(429);
  });
});

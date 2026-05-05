/**
 * Integration tests for POST /api/chat/general — OpenAI tool-use assistant.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";
import { fakeProfile } from "@/tests/fixtures/profile";

vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/get-user", () => ({
  getUser: () => getUserMock(),
  getUserOrNull: () => getUserMock().catch(() => null),
}));

vi.mock("@/lib/data/profile", () => ({
  getProfile: vi.fn().mockResolvedValue(
    Object.assign(
      {},
      {
        userId: "u",
        fullName: "Jane",
        school: "Wharton",
        graduationYear: 2027,
        targetRoles: [],
        targetFirms: [],
        bioSummary: "",
        resumeRawText: "",
        experiences: [],
        education: [],
        skills: [],
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ),
  ),
}));

vi.mock("@/lib/ai/assistant-tools", () => ({
  executeTool: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/ai/assistant-tools-openai", () => ({
  ASSISTANT_TOOLS_OPENAI: [],
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: { role: "assistant", content: "[mock answer]", tool_calls: undefined },
              finish_reason: "stop",
            },
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

const validBody = { messages: [{ role: "user" as const, content: "How am I doing?" }] };

describe("POST /api/chat/general", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/chat/general/route");
    const res = await POST(
      new Request("http://localhost/api/chat/general", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "11.0.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed body", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-gen-bad" }));
    const { POST } = await import("@/app/api/chat/general/route");
    const res = await POST(
      new Request("http://localhost/api/chat/general", {
        method: "POST",
        body: JSON.stringify({ foo: "bar" }),
        headers: { "x-forwarded-for": "11.0.0.2", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("streams ndjson on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-gen-ok" }));
    void fakeProfile; // type-only sanity
    const { POST } = await import("@/app/api/chat/general/route");
    const res = await POST(
      new Request("http://localhost/api/chat/general", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "11.0.0.3", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/x-ndjson/);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let body = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      body += decoder.decode(value);
    }
    expect(body).toContain("mock answer");
    expect(body).toContain("done");
  });

  it("returns 429 after exhausting per-user budget", async () => {
    const userId = "u-gen-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/chat/general/route");
    for (let i = 0; i < 10; i++) {
      const res = await POST(
        new Request("http://localhost/api/chat/general", {
          method: "POST",
          body: JSON.stringify(validBody),
          headers: { "x-forwarded-for": `11.1.${i}.1`, "Content-Type": "application/json" },
        }),
      );
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
      new Request("http://localhost/api/chat/general", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "x-forwarded-for": "11.1.99.99", "Content-Type": "application/json" },
      }),
    );
    expect(denied.status).toBe(429);
  });
});

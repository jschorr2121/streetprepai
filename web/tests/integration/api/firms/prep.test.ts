/**
 * Integration tests for POST /api/firms/[slug]/prep — streaming firm prep sheet.
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

const getFirmBySlugMock = vi.fn();
vi.mock("@/lib/data/firms", () => ({
  getFirmBySlug: (...args: unknown[]) => getFirmBySlugMock(...args),
  getAllFirms: vi.fn(),
}));

vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropic: () => ({
    messages: {
      stream: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "mocked " } };
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "firmprep" } };
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
  getFirmBySlugMock.mockReset();
  getFirmBySlugMock.mockResolvedValue({
    slug: "goldman-sachs",
    name: "Goldman Sachs",
    tier: "Bulge Bracket",
    hq: "New York",
    description: "GS investment bank.",
    latestEarningsRaw: "Q4 2025 earnings: revenue up 8%.",
  });
});

function makeReq(ip: string) {
  return new Request("http://localhost/api/firms/goldman-sachs/prep", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "Content-Type": "application/json" },
  });
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("POST /api/firms/[slug]/prep", () => {
  it("returns 401 when unauthenticated", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/firms/[slug]/prep/route");
    const res = await POST(makeReq("24.0.0.1"), params("goldman-sachs"));
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid slug", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-fp-bad" }));
    const { POST } = await import("@/app/api/firms/[slug]/prep/route");
    const res = await POST(makeReq("24.0.0.2"), params("INVALID SLUG!!"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when firm not found", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-fp-404" }));
    getFirmBySlugMock.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/firms/[slug]/prep/route");
    const res = await POST(makeReq("24.0.0.4"), params("unknown-firm"));
    expect(res.status).toBe(404);
  });

  it("streams text on happy path", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-fp-ok" }));
    const { POST } = await import("@/app/api/firms/[slug]/prep/route");
    const res = await POST(makeReq("24.0.0.3"), params("goldman-sachs"));
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
    const userId = "u-fp-rl";
    getUserMock.mockResolvedValue(fakeUser({ id: userId }));
    const { POST } = await import("@/app/api/firms/[slug]/prep/route");
    for (let i = 0; i < 10; i++) {
      const res = await POST(
        new Request("http://localhost/api/firms/goldman-sachs/prep", {
          method: "POST",
          headers: { "x-forwarded-for": `24.1.${i}.1`, "Content-Type": "application/json" },
        }),
        params("goldman-sachs"),
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
      new Request("http://localhost/api/firms/goldman-sachs/prep", {
        method: "POST",
        headers: { "x-forwarded-for": "24.1.99.99", "Content-Type": "application/json" },
      }),
      params("goldman-sachs"),
    );
    expect(denied.status).toBe(429);
  });
});

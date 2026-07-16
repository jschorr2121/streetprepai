/**
 * Mid-stream failure on /api/chat/stream: the response stays 200 (headers are
 * already sent), and the error is framed with STREAM_ERROR_SENTINEL — never
 * the legacy in-band "[Error: …]" prose the client would render as prose.
 */
import { describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/tests/fixtures/user";
import { STREAM_ERROR_SENTINEL, splitStreamError } from "@/lib/streaming/stream-error";

vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

vi.mock("@/lib/supabase/get-user", () => ({
  getUser: () => Promise.resolve(fakeUser({ id: "u-stream-err" })),
  getUserOrNull: () => Promise.resolve(fakeUser({ id: "u-stream-err" })),
}));

vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropic: () => ({
    messages: {
      stream: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "partial " } };
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "answer" } };
          throw new Error("upstream connection reset");
        },
        finalMessage: async () => {
          throw new Error("upstream connection reset");
        },
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

vi.mock("@/lib/logging/request-context", () => ({
  getRequestLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => ({ info: vi.fn() }),
  }),
}));

describe("POST /api/chat/stream — mid-stream failure", () => {
  it("frames the error with the sentinel and keeps partial content clean", async () => {
    const { POST } = await import("@/app/api/chat/stream/route");
    const res = await POST(
      new Request("http://localhost/api/chat/stream", {
        method: "POST",
        body: JSON.stringify({
          guideTitle: "DCF Fundamentals",
          guideContent: "DCF projects future cash flows discounted to today.",
          messages: [{ role: "user" as const, content: "what is WACC?" }],
        }),
        headers: { "x-forwarded-for": "10.2.0.1", "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let body = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      body += decoder.decode(value, { stream: true });
    }

    expect(body).not.toContain("[Error:");
    expect(body).toContain(STREAM_ERROR_SENTINEL);

    const { content, error } = splitStreamError(body);
    expect(content).toBe("partial answer");
    expect(error).toBeTruthy();
    // Raw upstream error text must not leak to the client.
    expect(error).not.toContain("upstream connection reset");
  });
});

/**
 * Integration tests for POST /api/relationships/prep-person semantic recall
 * — verifies the prep-person prompt is enriched with past chats from
 * pgvector when contactId is supplied, and unchanged otherwise.
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

// Capture the user prompt sent to Anthropic so we can assert on it.
const streamCalls: Array<{ messages: Array<{ role: string; content: string }> }> = [];

vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropic: () => ({
    messages: {
      stream: vi.fn().mockImplementation((args) => {
        streamCalls.push(args);
        return {
          [Symbol.asyncIterator]: async function* () {
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: "ok" },
            };
          },
          finalMessage: async () => ({
            model: "claude-sonnet-4-6",
            usage: { input_tokens: 1, output_tokens: 1 },
          }),
        };
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

const findSimilarChatsMock = vi.fn();
vi.mock("@/lib/data/semantic-recall", () => ({
  findSimilarChats: (opts: unknown) => findSimilarChatsMock(opts),
}));

beforeEach(() => {
  getUserMock.mockReset();
  findSimilarChatsMock.mockReset();
  streamCalls.length = 0;
});

async function drain(res: Response) {
  if (!res.body) return;
  const reader = res.body.getReader();
  while (true) {
    const r = await reader.read();
    if (r.done) break;
  }
}

const baseBody = {
  name: "Alex Chen",
  firm: "Goldman Sachs",
  title: "VP",
  bio: "VP at GS TMT.",
};

describe("POST /api/relationships/prep-person · semantic recall", () => {
  it("when contactId is supplied and recall returns hits, enriches the prompt with past_chats", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-recall-hit" }));
    findSimilarChatsMock.mockResolvedValue([
      {
        chatId: "c1",
        contactId: "contact-a",
        similarity: 0.91,
        summaryText: "topic: TMT deal flow\ncommitment: intro to summer analyst",
      },
    ]);

    const { POST } = await import("@/app/api/relationships/prep-person/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/prep-person", {
        method: "POST",
        body: JSON.stringify({ ...baseBody, contactId: "contact-a" }),
        headers: {
          "x-forwarded-for": "55.0.0.1",
          "Content-Type": "application/json",
        },
      }),
    );
    expect(res.status).toBe(200);
    await drain(res);

    expect(findSimilarChatsMock).toHaveBeenCalledTimes(1);
    const recallArgs = findSimilarChatsMock.mock.calls[0]![0];
    expect(recallArgs.userId).toBe("u-recall-hit");
    expect(recallArgs.contactId).toBe("contact-a");
    expect(recallArgs.k).toBe(3);
    expect(recallArgs.queryText).toContain("Alex Chen");
    expect(recallArgs.queryText).toContain("Goldman Sachs");

    expect(streamCalls).toHaveLength(1);
    const userMsg = streamCalls[0]!.messages[0]!.content;
    expect(userMsg).toContain("Past conversations with this contact");
    expect(userMsg).toContain("TMT deal flow");
    expect(userMsg).toContain("intro to summer analyst");
    expect(userMsg).toContain("similarity 0.91");
    // Wrapping tag for injection safety
    expect(userMsg).toContain("<past_chats>");
    expect(userMsg).toContain("</past_chats>");
  });

  it("when contactId is supplied but recall returns no hits, prompt does NOT include past_chats", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-recall-empty" }));
    findSimilarChatsMock.mockResolvedValue([]);

    const { POST } = await import("@/app/api/relationships/prep-person/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/prep-person", {
        method: "POST",
        body: JSON.stringify({ ...baseBody, contactId: "contact-b" }),
        headers: {
          "x-forwarded-for": "55.0.0.2",
          "Content-Type": "application/json",
        },
      }),
    );
    expect(res.status).toBe(200);
    await drain(res);

    expect(findSimilarChatsMock).toHaveBeenCalledTimes(1);
    const userMsg = streamCalls[0]!.messages[0]!.content;
    expect(userMsg).not.toContain("Past conversations");
    expect(userMsg).not.toContain("past_chats");
  });

  it("when contactId is omitted, recall is NOT called and prompt matches legacy shape", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-recall-skip" }));

    const { POST } = await import("@/app/api/relationships/prep-person/route");
    const res = await POST(
      new Request("http://localhost/api/relationships/prep-person", {
        method: "POST",
        body: JSON.stringify(baseBody),
        headers: {
          "x-forwarded-for": "55.0.0.3",
          "Content-Type": "application/json",
        },
      }),
    );
    expect(res.status).toBe(200);
    await drain(res);

    expect(findSimilarChatsMock).not.toHaveBeenCalled();
    const userMsg = streamCalls[0]!.messages[0]!.content;
    expect(userMsg).not.toContain("Past conversations");
    expect(userMsg).toContain("Alex Chen");
    expect(userMsg).toContain("Produce the prep sheet");
  });
});

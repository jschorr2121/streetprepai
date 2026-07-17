/**
 * Integration tests for POST /api/chat/assistant — AI SDK v7 assistant chat.
 *
 * `ai` / `@ai-sdk/anthropic` are mocked at the module boundary: the tests
 * assert the route's own contract (auth gate, body validation, persistence
 * order, usage logging) rather than SDK internals.
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

const toUIMessageStreamResponseMock = vi.fn();
const streamTextMock = vi.fn(() => ({
  toUIMessageStreamResponse: toUIMessageStreamResponseMock,
}));
vi.mock("ai", () => ({
  streamText: (opts: unknown) => streamTextMock(opts as never),
  convertToModelMessages: vi.fn(async (msgs: Array<{ role: string }>) =>
    msgs.map((m) => ({ role: m.role, content: "converted" })),
  ),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mock-anthropic-model"),
}));

const logUsageMock = vi.fn();
vi.mock("@/lib/ai/usage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/usage")>();
  return {
    ...actual,
    logUsage: (payload: unknown) => logUsageMock(payload),
    assertUnderQuota: vi.fn().mockResolvedValue({ ok: true, usedUsd: 0 }),
    getUserUsageThisMonth: vi.fn().mockResolvedValue({ totalUsd: 0, rowCount: 0 }),
  };
});

const withUserMock = vi.fn(async (_token: unknown, fn: (tx: object) => Promise<unknown>) => fn({}));
vi.mock("@/lib/db/client", () => ({
  withUser: (token: unknown, fn: (tx: object) => Promise<unknown>) => withUserMock(token, fn),
}));

const getThreadMock = vi.fn();
const createThreadMock = vi.fn();
const getMessagesMock = vi.fn();
const appendMessagesMock = vi.fn();
vi.mock("@/lib/db/queries/chat", () => ({
  getThread: (...args: unknown[]) => getThreadMock(...args),
  createThread: (...args: unknown[]) => createThreadMock(...args),
  getMessages: (...args: unknown[]) => getMessagesMock(...args),
  appendMessages: (...args: unknown[]) => appendMessagesMock(...args),
}));

beforeEach(() => {
  getUserMock.mockReset();
  streamTextMock.mockClear();
  toUIMessageStreamResponseMock.mockReset();
  toUIMessageStreamResponseMock.mockReturnValue(new Response("stream", { status: 200 }));
  logUsageMock.mockReset();
  withUserMock.mockClear();
  getThreadMock.mockReset();
  createThreadMock.mockReset();
  getMessagesMock.mockReset();
  appendMessagesMock.mockReset();
});

const THREAD_ID = "22222222-0000-4000-8000-000000000001";

function makeRequest(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/chat/assistant", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "x-forwarded-for": ip, "Content-Type": "application/json" },
  });
}

const validBody = {
  threadId: THREAD_ID,
  message: {
    id: "msg-1",
    role: "user" as const,
    parts: [{ type: "text" as const, text: "How should I study for LBO questions?" }],
  },
};

describe("POST /api/chat/assistant", () => {
  it("returns 401 when unauthenticated (no model call, no DB write)", async () => {
    getUserMock.mockRejectedValue(new Error("Not authenticated"));
    const { POST } = await import("@/app/api/chat/assistant/route");
    const res = await POST(makeRequest(validBody, "10.9.0.1"));
    expect(res.status).toBe(401);
    expect(streamTextMock).not.toHaveBeenCalled();
    expect(appendMessagesMock).not.toHaveBeenCalled();
  });

  it("returns 400 on malformed body", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-bad" }));
    const { POST } = await import("@/app/api/chat/assistant/route");
    const res = await POST(
      makeRequest({ threadId: "not-a-uuid", message: validBody.message }, "10.9.0.2"),
    );
    expect(res.status).toBe(400);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("creates the thread and persists the user turn before the model call", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-new" }));
    getThreadMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/chat/assistant/route");
    const res = await POST(makeRequest(validBody, "10.9.0.3"));
    expect(res.status).toBe(200);

    expect(createThreadMock).toHaveBeenCalledWith(
      expect.anything(),
      "u-assist-new",
      THREAD_ID,
      "How should I study for LBO questions?",
    );
    expect(appendMessagesMock).toHaveBeenCalledWith(expect.anything(), "u-assist-new", THREAD_ID, [
      {
        role: "user",
        parts: [{ type: "text", text: "How should I study for LBO questions?" }],
      },
    ]);
    // History is not loaded for a brand-new thread.
    expect(getMessagesMock).not.toHaveBeenCalled();

    // The model call includes the new user turn and the standalone system prompt.
    const call = streamTextMock.mock.calls[0]?.[0] as {
      system: string;
      messages: Array<{ role: string }>;
    };
    expect(call.system).toContain("standalone IB prep mentor");
    expect(call.messages).toHaveLength(1);
  });

  it("loads prior history for an existing thread and persists the assistant reply onEnd", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-old" }));
    getThreadMock.mockResolvedValue({ id: THREAD_ID, title: "t" });
    getMessagesMock.mockResolvedValue([
      { id: "m1", role: "user", parts: [{ type: "text", text: "earlier question" }] },
      { id: "m2", role: "assistant", parts: [{ type: "text", text: "earlier answer" }] },
    ]);
    const { POST } = await import("@/app/api/chat/assistant/route");
    const res = await POST(makeRequest(validBody, "10.9.0.4"));
    expect(res.status).toBe(200);
    expect(createThreadMock).not.toHaveBeenCalled();

    const call = streamTextMock.mock.calls[0]?.[0] as { messages: Array<{ role: string }> };
    expect(call.messages).toHaveLength(3);

    // Drive the persistence callback the way the SDK would on stream end.
    const streamOpts = toUIMessageStreamResponseMock.mock.calls[0]?.[0] as {
      originalMessages: unknown[];
      onEnd: (event: { responseMessage: unknown }) => Promise<void>;
    };
    expect(streamOpts.originalMessages).toHaveLength(3);
    appendMessagesMock.mockClear();
    await streamOpts.onEnd({
      responseMessage: {
        id: "resp-1",
        role: "assistant",
        parts: [{ type: "text", text: "streamed reply" }],
      },
    });
    expect(appendMessagesMock).toHaveBeenCalledWith(expect.anything(), "u-assist-old", THREAD_ID, [
      { role: "assistant", parts: [{ type: "text", text: "streamed reply" }] },
    ]);
  });

  it("logs usage from the stream's onEnd with mapped token fields", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-usage" }));
    getThreadMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.5"));

    const call = streamTextMock.mock.calls[0]?.[0] as {
      onEnd: (event: { usage: unknown }) => void;
    };
    call.onEnd({
      usage: {
        inputTokens: 100,
        outputTokens: 40,
        inputTokenDetails: { noCacheTokens: 70, cacheReadTokens: 30, cacheWriteTokens: 0 },
      },
    });
    expect(logUsageMock).toHaveBeenCalledWith({
      model: "claude-sonnet-4-6",
      usage: {
        input_tokens: 70,
        output_tokens: 40,
        cache_read_input_tokens: 30,
        cache_creation_input_tokens: 0,
      },
      endpoint: "chat/assistant",
      userId: "u-assist-usage",
    });
  });

  it("returns 429 after exhausting the expensive-tier budget", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-rl" }));
    getThreadMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/chat/assistant/route");
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeRequest(validBody, `10.8.${i}.1`));
      expect([200, 502]).toContain(res.status);
    }
    const denied = await POST(makeRequest(validBody, "10.8.99.99"));
    expect(denied.status).toBe(429);
  });
});

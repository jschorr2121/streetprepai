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

// consumeStream's onError logs through the shared logger (not console.error)
// so a mid-stream failure on this highest-volume route reaches Sentry via the
// server config's pinoIntegration.
const loggerErrorMock = vi.fn();
vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: loggerErrorMock, debug: vi.fn() },
}));

const toUIMessageStreamResponseMock = vi.fn();
const consumeStreamMock = vi.fn(() => Promise.resolve());
const streamTextMock = vi.fn(() => ({
  toUIMessageStreamResponse: toUIMessageStreamResponseMock,
  consumeStream: consumeStreamMock,
}));
vi.mock("ai", () => ({
  streamText: (opts: unknown) => streamTextMock(opts as never),
  convertToModelMessages: vi.fn(async (msgs: Array<{ role: string }>) =>
    msgs.map((m) => ({ role: m.role, content: "converted" })),
  ),
  // buildAssistantTools (imported by the route) also resolves "ai" to this mock.
  tool: (def: unknown) => def,
  stepCountIs: (n: number) => ({ kind: "step-count", n }),
}));

vi.mock("@ai-sdk/anthropic", () => {
  const anthropic = Object.assign(
    vi.fn(() => "mock-anthropic-model"),
    {
      tools: {
        webSearch_20250305: (cfg: Record<string, unknown>) => ({
          kind: "provider-web-search",
          ...cfg,
        }),
      },
    },
  );
  return { anthropic };
});

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
const updateThreadTitleMock = vi.fn();
vi.mock("@/lib/db/queries/chat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db/queries/chat")>();
  return {
    ...actual, // keep the real toStoredParts
    getThread: (...args: unknown[]) => getThreadMock(...args),
    createThread: (...args: unknown[]) => createThreadMock(...args),
    getMessages: (...args: unknown[]) => getMessagesMock(...args),
    appendMessages: (...args: unknown[]) => appendMessagesMock(...args),
    updateThreadTitle: (...args: unknown[]) => updateThreadTitleMock(...args),
  };
});

const generateThreadTitleMock = vi.fn();
vi.mock("@/lib/ai/chat-title", () => ({
  generateThreadTitle: (...args: unknown[]) => generateThreadTitleMock(...args),
}));

beforeEach(() => {
  getUserMock.mockReset();
  streamTextMock.mockClear();
  toUIMessageStreamResponseMock.mockReset();
  toUIMessageStreamResponseMock.mockReturnValue(new Response("stream", { status: 200 }));
  consumeStreamMock.mockClear();
  loggerErrorMock.mockClear();
  logUsageMock.mockReset();
  withUserMock.mockClear();
  getThreadMock.mockReset();
  createThreadMock.mockReset();
  // Default: the insert succeeds (the common, non-racing case). Tests for the
  // concurrent-first-POST race override this to `false`.
  createThreadMock.mockResolvedValue(true);
  getMessagesMock.mockReset();
  appendMessagesMock.mockReset();
  updateThreadTitleMock.mockReset();
  generateThreadTitleMock.mockReset();
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

    // The model call includes the new user turn, the standalone system prompt,
    // and the closure-injected tool registry with a bounded step count.
    const call = streamTextMock.mock.calls[0]?.[0] as {
      system: {
        role: string;
        content: string;
        providerOptions: { anthropic: { cacheControl: { type: string } } };
      };
      messages: Array<{ role: string }>;
      tools: Record<string, unknown>;
      stopWhen: unknown;
    };
    expect(call.system.role).toBe("system");
    expect(call.system.content).toContain("standalone IB prep mentor");
    // Prompt caching: the stable prefix carries an Anthropic ephemeral cache
    // breakpoint so it is not re-billed at full input rate every turn.
    expect(call.system.providerOptions.anthropic.cacheControl).toEqual({ type: "ephemeral" });
    expect(call.messages).toHaveLength(1);
    expect(Object.keys(call.tools).sort()).toEqual([
      "get_applied_jobs",
      "get_contact",
      "get_firm",
      "get_resume",
      "get_upcoming_events",
      "list_contacts",
      "search_chat_logs",
      "web_search",
    ]);
    expect(call.tools["web_search"]).toEqual({ kind: "provider-web-search", maxUses: 3 });
    expect(call.stopWhen).toEqual({ kind: "step-count", n: 6 });

    // Web-search citations must reach the client.
    const streamOpts = toUIMessageStreamResponseMock.mock.calls[0]?.[0] as {
      sendSources?: boolean;
    };
    expect(streamOpts.sendSources).toBe(true);
  });

  it("marks the stable prefix with an Anthropic ephemeral cache breakpoint", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-cache" }));
    getThreadMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.13"));

    // The system prompt is passed as a SystemModelMessage (not a bare string) so
    // it can carry providerOptions — the only way to attach cache_control. The
    // breakpoint lands on the system block, which Anthropic caches together with
    // the tool schemas that precede it in the serialized request.
    const call = streamTextMock.mock.calls[0]?.[0] as {
      system: { providerOptions?: { anthropic?: { cacheControl?: unknown } } };
    };
    expect(call.system.providerOptions?.anthropic?.cacheControl).toEqual({ type: "ephemeral" });
  });

  it("persists settled tool parts from the response message", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-tools" }));
    getThreadMock.mockResolvedValue({ id: THREAD_ID, title: "t" });
    getMessagesMock.mockResolvedValue([]);
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.6"));

    const streamOpts = toUIMessageStreamResponseMock.mock.calls[0]?.[0] as {
      onEnd: (event: { responseMessage: unknown }) => Promise<void>;
    };
    appendMessagesMock.mockClear();
    await streamOpts.onEnd({
      responseMessage: {
        id: "resp-2",
        role: "assistant",
        parts: [
          { type: "step-start" },
          {
            type: "tool-get_applied_jobs",
            toolCallId: "call_9",
            state: "output-available",
            input: {},
            output: { count: 1, byStage: {} },
          },
          { type: "text", text: "Your GS app is at superday.", state: "done" },
        ],
      },
    });
    expect(appendMessagesMock).toHaveBeenCalledWith(
      expect.anything(),
      "u-assist-tools",
      THREAD_ID,
      [
        {
          role: "assistant",
          parts: [
            {
              type: "tool-get_applied_jobs",
              toolCallId: "call_9",
              state: "output-available",
              input: {},
              output: { count: 1, byStage: {} },
            },
            { type: "text", text: "Your GS app is at superday." },
          ],
        },
      ],
    );
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

  it("caps the model context window on long threads but keeps full history for the client", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-long" }));
    getThreadMock.mockResolvedValue({ id: THREAD_ID, title: "t" });
    getMessagesMock.mockResolvedValue(
      Array.from({ length: 40 }, (_, i) => ({
        id: `m${i}`,
        role: i % 2 === 0 ? "user" : "assistant",
        parts: [{ type: "text", text: `turn ${i}` }],
      })),
    );
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.7"));

    const call = streamTextMock.mock.calls[0]?.[0] as { messages: unknown[] };
    expect(call.messages).toHaveLength(30);
    const streamOpts = toUIMessageStreamResponseMock.mock.calls[0]?.[0] as {
      originalMessages: unknown[];
    };
    expect(streamOpts.originalMessages).toHaveLength(41);
  });

  it("logs usage from the stream's onEnd with mapped token fields", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-usage" }));
    getThreadMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.5"));

    const call = streamTextMock.mock.calls[0]?.[0] as {
      onEnd: (event: { usage: unknown; content: unknown[] }) => void;
    };
    call.onEnd({
      usage: {
        inputTokens: 100,
        outputTokens: 40,
        inputTokenDetails: { noCacheTokens: 70, cacheReadTokens: 30, cacheWriteTokens: 0 },
      },
      content: [
        { type: "tool-result", toolName: "web_search", output: [] },
        { type: "tool-result", toolName: "get_resume", output: {} },
        { type: "tool-result", toolName: "web_search", output: [] },
        { type: "text", text: "answer" },
      ],
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
      // Two web searches → 2 × $0.01 flat surcharge on top of token cost.
      surchargeUsd: 0.02,
    });
  });

  it("drains the model stream via consumeStream so main-call usage logs even on client disconnect", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-drain" }));
    getThreadMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.11"));

    // The route must drain the source stream server-side, regardless of whether
    // the client keeps reading the response body. Without this, streamText's
    // onEnd never fires on abort and the expensive sonnet call logs $0.
    expect(consumeStreamMock).toHaveBeenCalledTimes(1);

    // consumeStream draining the source is exactly what guarantees streamText's
    // onEnd runs — driving it here confirms usage still logs for the main call.
    const call = streamTextMock.mock.calls[0]?.[0] as {
      onEnd: (event: { usage: unknown; content: unknown[] }) => void;
    };
    call.onEnd({
      usage: {
        inputTokens: 50,
        outputTokens: 20,
        inputTokenDetails: { noCacheTokens: 50, cacheReadTokens: 0, cacheWriteTokens: 0 },
      },
      content: [{ type: "text", text: "answer" }],
    });
    expect(logUsageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-6",
        endpoint: "chat/assistant",
        userId: "u-assist-drain",
        surchargeUsd: 0,
      }),
    );
  });

  it("logs a mid-stream consumeStream failure through the shared logger", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-stream-err" }));
    getThreadMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.14"));

    // Drive consumeStream's onError the way the AI SDK would on a mid-stream
    // failure (rate limit, context-length error, provider outage).
    const opts = consumeStreamMock.mock.calls[0]?.[0] as {
      onError: (err: unknown) => void;
    };
    const streamErr = new Error("upstream connection reset");
    opts.onError(streamErr);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        err: streamErr,
        routeKey: "chat/assistant",
        userId: "u-assist-stream-err",
      }),
      "chat_assistant_stream_consume_error",
    );
  });

  it("generates and persists a title on the thread's first exchange (LLM auto-titling)", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-title-new" }));
    getThreadMock.mockResolvedValue(null); // new thread
    generateThreadTitleMock.mockResolvedValue("LBO study plan");
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.8"));

    const streamOpts = toUIMessageStreamResponseMock.mock.calls[0]?.[0] as {
      onEnd: (event: { responseMessage: unknown }) => Promise<void>;
    };
    await streamOpts.onEnd({
      responseMessage: {
        id: "resp-title-1",
        role: "assistant",
        parts: [{ type: "text", text: "Here's a plan.", state: "done" }],
      },
    });

    expect(generateThreadTitleMock).toHaveBeenCalledWith({
      userText: "How should I study for LBO questions?",
      assistantText: "Here's a plan.",
      userId: "u-assist-title-new",
    });
    expect(updateThreadTitleMock).toHaveBeenCalledWith(
      expect.anything(),
      "u-assist-title-new",
      THREAD_ID,
      "LBO study plan",
    );
  });

  it("does not attempt titling on an existing thread's follow-up turn", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-title-old" }));
    getThreadMock.mockResolvedValue({ id: THREAD_ID, title: "already titled" });
    getMessagesMock.mockResolvedValue([]);
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.9"));

    const streamOpts = toUIMessageStreamResponseMock.mock.calls[0]?.[0] as {
      onEnd: (event: { responseMessage: unknown }) => Promise<void>;
    };
    await streamOpts.onEnd({
      responseMessage: {
        id: "resp-title-2",
        role: "assistant",
        parts: [{ type: "text", text: "follow-up answer", state: "done" }],
      },
    });

    expect(generateThreadTitleMock).not.toHaveBeenCalled();
    expect(updateThreadTitleMock).not.toHaveBeenCalled();
  });

  it("skips titling when createThread loses the concurrent-first-POST race", async () => {
    // Both racers see getThread → null, but only one insert actually lands.
    // isNewThread must come from createThread's own result, not from
    // `!existing` — otherwise the loser would also fire a billed title call.
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-title-race" }));
    getThreadMock.mockResolvedValue(null);
    createThreadMock.mockResolvedValue(false); // lost the race
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.15"));

    const streamOpts = toUIMessageStreamResponseMock.mock.calls[0]?.[0] as {
      onEnd: (event: { responseMessage: unknown }) => Promise<void>;
    };
    await streamOpts.onEnd({
      responseMessage: {
        id: "resp-title-race",
        role: "assistant",
        parts: [{ type: "text", text: "an answer", state: "done" }],
      },
    });

    expect(generateThreadTitleMock).not.toHaveBeenCalled();
    expect(updateThreadTitleMock).not.toHaveBeenCalled();
  });

  it("is best-effort: a titling failure is swallowed and does not throw out of onEnd", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-title-fail" }));
    getThreadMock.mockResolvedValue(null);
    generateThreadTitleMock.mockRejectedValue(new Error("model unavailable"));
    const { POST } = await import("@/app/api/chat/assistant/route");
    const res = await POST(makeRequest(validBody, "10.9.0.10"));
    expect(res.status).toBe(200); // the chat response itself succeeded already

    const streamOpts = toUIMessageStreamResponseMock.mock.calls[0]?.[0] as {
      onEnd: (event: { responseMessage: unknown }) => Promise<void>;
    };
    await expect(
      streamOpts.onEnd({
        responseMessage: {
          id: "resp-title-3",
          role: "assistant",
          parts: [{ type: "text", text: "an answer", state: "done" }],
        },
      }),
    ).resolves.toBeUndefined();

    // The assistant message still persisted despite the titling failure.
    expect(appendMessagesMock).toHaveBeenCalledWith(
      expect.anything(),
      "u-assist-title-fail",
      THREAD_ID,
      [{ role: "assistant", parts: [{ type: "text", text: "an answer" }] }],
    );
    expect(updateThreadTitleMock).not.toHaveBeenCalled();
  });

  it("does not title a thread whose assistant reply failed to persist", async () => {
    getUserMock.mockResolvedValue(fakeUser({ id: "u-assist-persist-fail" }));
    getThreadMock.mockResolvedValue(null); // new thread → would normally title
    // First append (the user turn, before the model call) succeeds; the second
    // (the assistant reply, in onEnd) fails.
    appendMessagesMock.mockResolvedValueOnce(undefined).mockRejectedValue(new Error("db down"));
    generateThreadTitleMock.mockResolvedValue("should not be used");
    const { POST } = await import("@/app/api/chat/assistant/route");
    await POST(makeRequest(validBody, "10.9.0.12"));

    const streamOpts = toUIMessageStreamResponseMock.mock.calls[0]?.[0] as {
      onEnd: (event: { responseMessage: unknown }) => Promise<void>;
    };
    // The persist failure is swallowed (onEnd resolves), but titling is skipped
    // — no point spending a haiku title call on a first exchange that isn't stored.
    await expect(
      streamOpts.onEnd({
        responseMessage: {
          id: "resp-persist-fail",
          role: "assistant",
          parts: [{ type: "text", text: "an answer", state: "done" }],
        },
      }),
    ).resolves.toBeUndefined();
    expect(generateThreadTitleMock).not.toHaveBeenCalled();
    expect(updateThreadTitleMock).not.toHaveBeenCalled();
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

import { describe, expect, it, beforeEach, vi } from "vitest";

describe("summaryEmbedText", () => {
  it("joins all high-signal fields with type prefixes", async () => {
    const { summaryEmbedText } = await import("@/lib/ai/embeddings");
    const text = summaryEmbedText({
      topics: ["TMT deal flow", "M&A vs ECM"],
      adviceGiven: ["read M&I"],
      commitments: ["intro to summer analyst"],
      personalDetails: ["from Boston", "dog named Miso"],
      followUps: [{ description: "send thank-you" }],
    });
    expect(text).toContain("topic: TMT deal flow");
    expect(text).toContain("topic: M&A vs ECM");
    expect(text).toContain("advice: read M&I");
    expect(text).toContain("commitment: intro to summer analyst");
    expect(text).toContain("personal: from Boston");
    expect(text).toContain("personal: dog named Miso");
    expect(text).toContain("followup: send thank-you");
  });

  it("returns empty string for fully empty summary", async () => {
    const { summaryEmbedText } = await import("@/lib/ai/embeddings");
    expect(summaryEmbedText({})).toBe("");
    expect(
      summaryEmbedText({
        topics: [],
        adviceGiven: [],
        commitments: [],
        personalDetails: [],
        followUps: [],
      }),
    ).toBe("");
  });

  it("handles partial fields without crashing", async () => {
    const { summaryEmbedText } = await import("@/lib/ai/embeddings");
    const text = summaryEmbedText({ topics: ["a"], followUps: [{ description: "b" }] });
    expect(text).toBe("topic: a\nfollowup: b");
  });
});

describe("embedText", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("calls OpenAI embeddings, logs usage, and returns the vector on happy path", async () => {
    const fakeVec = new Array(1536).fill(0).map((_, i) => (i % 2 ? 0.1 : -0.1));
    const create = vi.fn().mockResolvedValue({
      data: [{ embedding: fakeVec, index: 0, object: "embedding" }],
      model: "text-embedding-3-small",
      usage: { prompt_tokens: 42, total_tokens: 42 },
    });
    vi.doMock("@/lib/ai/openai", () => ({
      getOpenAI: () => ({ embeddings: { create } }),
    }));
    const logUsage = vi.fn();
    vi.doMock("@/lib/ai/usage", () => ({ logUsage }));

    const { embedText } = await import("@/lib/ai/embeddings");
    const vec = await embedText("hello world", {
      userId: "user-emb",
      endpoint: "embed/test",
    });

    expect(vec).toBe(fakeVec);
    expect(vec).toHaveLength(1536);
    expect(create).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "hello world",
    });
    expect(logUsage).toHaveBeenCalledTimes(1);
    const args = logUsage.mock.calls[0]![0];
    expect(args.model).toBe("text-embedding-3-small");
    expect(args.endpoint).toBe("embed/test");
    expect(args.userId).toBe("user-emb");
    expect(args.usage.input_tokens).toBe(42);
    expect(args.usage.output_tokens).toBe(0);
  });

  it("falls back to default endpoint when not provided", async () => {
    const fakeVec = new Array(1536).fill(0.01);
    vi.doMock("@/lib/ai/openai", () => ({
      getOpenAI: () => ({
        embeddings: {
          create: vi.fn().mockResolvedValue({
            data: [{ embedding: fakeVec }],
            usage: { prompt_tokens: 1 },
          }),
        },
      }),
    }));
    const logUsage = vi.fn();
    vi.doMock("@/lib/ai/usage", () => ({ logUsage }));

    const { embedText } = await import("@/lib/ai/embeddings");
    await embedText("x");
    expect(logUsage.mock.calls[0]![0].endpoint).toBe("embeddings");
    expect(logUsage.mock.calls[0]![0].userId).toBeUndefined();
  });

  it("throws when dimensions don't match expected", async () => {
    vi.doMock("@/lib/ai/openai", () => ({
      getOpenAI: () => ({
        embeddings: {
          create: vi.fn().mockResolvedValue({
            data: [{ embedding: [0.1, 0.2, 0.3] }],
            usage: { prompt_tokens: 1 },
          }),
        },
      }),
    }));
    vi.doMock("@/lib/ai/usage", () => ({ logUsage: vi.fn() }));

    const { embedText } = await import("@/lib/ai/embeddings");
    await expect(embedText("x")).rejects.toThrowError(/Unexpected embedding dimensions/);
  });

  it("throws when no vector is returned", async () => {
    vi.doMock("@/lib/ai/openai", () => ({
      getOpenAI: () => ({
        embeddings: {
          create: vi.fn().mockResolvedValue({
            data: [],
            usage: { prompt_tokens: 1 },
          }),
        },
      }),
    }));
    vi.doMock("@/lib/ai/usage", () => ({ logUsage: vi.fn() }));

    const { embedText } = await import("@/lib/ai/embeddings");
    await expect(embedText("x")).rejects.toThrowError(/Unexpected embedding dimensions/);
  });
});

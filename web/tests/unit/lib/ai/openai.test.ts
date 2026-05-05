import { describe, expect, it, beforeEach, vi } from "vitest";

describe("getOpenAI", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns a singleton across calls when OPENAI_API_KEY is set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-openai");
    const { getOpenAI } = await import("@/lib/ai/openai");
    const a = getOpenAI();
    const b = getOpenAI();
    expect(a).toBe(b);
  });

  it("throws a helpful error when OPENAI_API_KEY is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const { getOpenAI } = await import("@/lib/ai/openai");
    expect(() => getOpenAI()).toThrowError(/OPENAI_API_KEY is not set/);
  });

  it("exposes the expected OPENAI_MODELS map", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-openai");
    const { OPENAI_MODELS } = await import("@/lib/ai/openai");
    expect(OPENAI_MODELS).toEqual({ nano: "gpt-5.4-nano" });
  });
});

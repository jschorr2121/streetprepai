import { describe, expect, it, beforeEach, vi } from "vitest";

describe("getAnthropic", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns a singleton across calls when ANTHROPIC_API_KEY is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-anthropic");
    const { getAnthropic } = await import("@/lib/ai/anthropic");
    const a = getAnthropic();
    const b = getAnthropic();
    expect(a).toBe(b);
  });

  it("throws a helpful error when ANTHROPIC_API_KEY is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { getAnthropic } = await import("@/lib/ai/anthropic");
    expect(() => getAnthropic()).toThrowError(/ANTHROPIC_API_KEY is not set/);
  });

  it("exposes the expected MODELS map", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-anthropic");
    const { MODELS } = await import("@/lib/ai/anthropic");
    expect(MODELS).toEqual({
      opus: "claude-opus-4-7",
      sonnet: "claude-sonnet-4-6",
      haiku: "claude-haiku-4-5-20251001",
    });
  });
});

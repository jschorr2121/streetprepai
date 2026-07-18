/**
 * Unit tests for the thread-title sanitizer used by LLM auto-titling
 * (`chat/assistant`'s onEnd). The model is only ever asked for plain text —
 * this is the trim/clamp/strip step that stands in for the "never
 * JSON.parse model text" invariant.
 */
import { describe, expect, it } from "vitest";
import { sanitizeTitle } from "@/lib/ai/chat-title";

describe("sanitizeTitle", () => {
  it("trims surrounding whitespace", () => {
    expect(sanitizeTitle("  DCF terminal value question  ")).toBe("DCF terminal value question");
  });

  it("collapses internal newlines and repeated whitespace into single spaces", () => {
    expect(sanitizeTitle("LBO\nmodeling   walkthrough\n\n")).toBe("LBO modeling walkthrough");
  });

  it("strips wrapping quotes the model sometimes adds", () => {
    expect(sanitizeTitle('"Recruiting timeline advice"')).toBe("Recruiting timeline advice");
    expect(sanitizeTitle("'Recruiting timeline advice'")).toBe("Recruiting timeline advice");
    expect(sanitizeTitle("`Recruiting timeline advice`")).toBe("Recruiting timeline advice");
    expect(sanitizeTitle("“Curly quotes too”")).toBe("Curly quotes too");
  });

  it("clamps to the max length", () => {
    const long = "a".repeat(200);
    expect(sanitizeTitle(long, 10)).toHaveLength(10);
  });

  it("defaults to an 80-char clamp", () => {
    const long = "word ".repeat(40); // 200 chars
    expect(sanitizeTitle(long).length).toBeLessThanOrEqual(80);
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(sanitizeTitle("   \n  ")).toBe("");
  });
});

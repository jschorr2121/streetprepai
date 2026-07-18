import { describe, expect, it } from "vitest";
import { calculateCost, PRICING, type TokenUsage } from "@/lib/ai/pricing";

const cases: Array<[string, TokenUsage, number]> = [
  // pure input
  ["claude-opus-4-7", { input_tokens: 1_000_000, output_tokens: 0 }, 5.0],
  ["claude-sonnet-4-6", { input_tokens: 1_000_000, output_tokens: 0 }, 3.0],
  ["claude-haiku-4-5-20251001", { input_tokens: 1_000_000, output_tokens: 0 }, 1.0],
  ["gpt-5.4-nano", { input_tokens: 1_000_000, output_tokens: 0 }, 0.2],
  ["gpt-5.4-nano-2026-03-17", { input_tokens: 1_000_000, output_tokens: 0 }, 0.2],
  ["text-embedding-3-small", { input_tokens: 1_000_000, output_tokens: 0 }, 0.02],

  // pure output
  ["claude-opus-4-7", { input_tokens: 0, output_tokens: 1_000_000 }, 25.0],
  ["claude-sonnet-4-6", { input_tokens: 0, output_tokens: 1_000_000 }, 15.0],
  ["claude-haiku-4-5-20251001", { input_tokens: 0, output_tokens: 1_000_000 }, 5.0],
  ["gpt-5.4-nano", { input_tokens: 0, output_tokens: 1_000_000 }, 1.25],

  // cache write
  [
    "claude-opus-4-7",
    { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000 },
    6.25,
  ],
  [
    "claude-sonnet-4-6",
    { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000 },
    3.75,
  ],
  [
    "claude-haiku-4-5-20251001",
    { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000 },
    1.25,
  ],

  // cache read
  [
    "claude-opus-4-7",
    { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000 },
    0.5,
  ],
  [
    "claude-sonnet-4-6",
    { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000 },
    0.3,
  ],
  [
    "claude-haiku-4-5-20251001",
    { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000 },
    0.1,
  ],

  // mixed
  [
    "claude-sonnet-4-6",
    {
      input_tokens: 500_000,
      output_tokens: 200_000,
      cache_creation_input_tokens: 100_000,
      cache_read_input_tokens: 50_000,
    },
    // 0.5*3 + 0.2*15 + 0.1*3.75 + 0.05*0.3
    1.5 + 3 + 0.375 + 0.015,
  ],
];

describe("calculateCost", () => {
  it.each(cases)("computes cost for %s with usage %j → ~$%s", (model, usage, expected) => {
    const got = calculateCost(model, usage);
    expect(got).toBeCloseTo(expected, 6);
  });

  it("returns 0 for unknown model id", () => {
    expect(calculateCost("nonexistent-model", { input_tokens: 1_000_000, output_tokens: 0 })).toBe(
      0,
    );
  });

  it("treats null/undefined cache fields as zero", () => {
    const cost = calculateCost("claude-haiku-4-5-20251001", {
      input_tokens: 1000,
      output_tokens: 1000,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: undefined,
    });
    // (1000/1M)*1 + (1000/1M)*5 = 0.001 + 0.005 = 0.006
    expect(cost).toBeCloseTo(0.006, 9);
  });

  it("PRICING table has all required keys for each model", () => {
    for (const [model, p] of Object.entries(PRICING)) {
      expect(typeof p.input).toBe("number");
      expect(typeof p.output).toBe("number");
      expect(typeof p.cache_read).toBe("number");
      expect(typeof p.cache_write).toBe("number");
      expect(p.input).toBeGreaterThan(0);
      expect(model.length).toBeGreaterThan(0);
    }
  });
});

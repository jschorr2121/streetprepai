import { describe, expect, it } from "vitest";

import { analyzeAudio, type TimestampedWord } from "@/lib/audio/analyze";

// Helper: build a run of words spaced `gapSec` apart, each `durSec` long,
// starting at `startSec`.
function words(
  tokens: string[],
  {
    startSec = 0,
    durSec = 0.3,
    gapSec = 0.1,
  }: { startSec?: number; durSec?: number; gapSec?: number } = {},
): TimestampedWord[] {
  let t = startSec;
  return tokens.map((word) => {
    const start = t;
    const end = start + durSec;
    t = end + gapSec;
    return { word, start, end };
  });
}

describe("analyzeAudio — empty/edge inputs", () => {
  it("returns all-zero metrics for an empty word list", () => {
    expect(analyzeAudio([])).toEqual({
      wpm: 0,
      fillerCount: 0,
      pauseRatio: 0,
      longestPauseMs: 0,
      totalSpeakingMs: 0,
    });
  });

  it("returns all-zero metrics for a null-ish words argument", () => {
    // The guard is `!words || words.length === 0`; exercise the falsy branch
    // directly since TimestampedWord[] is otherwise required at the type level.
    expect(analyzeAudio(null as unknown as TimestampedWord[])).toEqual({
      wpm: 0,
      fillerCount: 0,
      pauseRatio: 0,
      longestPauseMs: 0,
      totalSpeakingMs: 0,
    });
  });

  it("single word with zero duration: zero speaking time, zero wpm, no pauses", () => {
    const result = analyzeAudio([{ word: "hello", start: 1, end: 1 }]);
    expect(result).toEqual({
      wpm: 0,
      fillerCount: 0,
      pauseRatio: 0,
      longestPauseMs: 0,
      totalSpeakingMs: 0,
    });
  });

  it("single filler word still counts toward fillerCount even with zero duration", () => {
    const result = analyzeAudio([{ word: "um", start: 2, end: 2 }]);
    expect(result.fillerCount).toBe(1);
    expect(result.wpm).toBe(0);
  });

  it("single word with nonzero duration produces a positive but unbounded wpm", () => {
    // 1 word over 0.5s = 1 / (0.5/60) = 120 wpm.
    const result = analyzeAudio([{ word: "hi", start: 0, end: 0.5 }]);
    expect(result.totalSpeakingMs).toBe(500);
    expect(result.wpm).toBe(120);
  });

  it("clamps totalSpeakingMs to 0 when the last word ends before the first starts", () => {
    // Malformed input (out-of-order words) — Math.max(0, ...) guards against negative duration.
    const result = analyzeAudio([
      { word: "b", start: 5, end: 5.2 },
      { word: "a", start: 0, end: 0.1 },
    ]);
    expect(result.totalSpeakingMs).toBe(0);
    expect(result.wpm).toBe(0);
  });
});

describe("analyzeAudio — wpm", () => {
  it("computes wpm over total speaking duration (first start to last end)", () => {
    // 4 words spanning exactly 60 seconds → 4 wpm.
    const ws: TimestampedWord[] = [
      { word: "one", start: 0, end: 1 },
      { word: "two", start: 20, end: 21 },
      { word: "three", start: 40, end: 41 },
      { word: "four", start: 59, end: 60 },
    ];
    const result = analyzeAudio(ws);
    expect(result.totalSpeakingMs).toBe(60_000);
    expect(result.wpm).toBe(4);
  });

  it("rounds wpm to the nearest integer", () => {
    // 10 words over 4 seconds = 10 / (4/60) = 150 wpm exactly.
    const ws = words(
      Array.from({ length: 10 }, (_, i) => `w${i}`),
      {
        durSec: 0.1,
        gapSec: 0.1,
      },
    );
    // 10 words * (0.1 dur + 0.1 gap) - 1 trailing gap = 10*0.2 - 0.1 = 1.9s... use explicit spans instead.
    const explicit: TimestampedWord[] = [
      { word: "a", start: 0, end: 0.1 },
      { word: "b", start: 0.4, end: 0.5 },
      { word: "c", start: 0.8, end: 0.9 },
      { word: "d", start: 1.2, end: 1.3 },
      { word: "e", start: 1.6, end: 1.7 },
      { word: "f", start: 2.0, end: 2.1 },
      { word: "g", start: 2.4, end: 2.5 },
      { word: "h", start: 2.8, end: 2.9 },
      { word: "i", start: 3.2, end: 3.3 },
      { word: "j", start: 3.6, end: 4.0 },
    ];
    void ws;
    const result = analyzeAudio(explicit);
    expect(result.totalSpeakingMs).toBe(4000);
    expect(result.wpm).toBe(150);
  });
});

describe("analyzeAudio — pause metrics", () => {
  it("a gap exactly at the 400ms threshold does NOT count as a pause (strictly greater than)", () => {
    const ws: TimestampedWord[] = [
      { word: "a", start: 0, end: 0.1 },
      { word: "b", start: 0.5, end: 0.6 }, // 400ms gap
    ];
    const result = analyzeAudio(ws);
    expect(result.longestPauseMs).toBe(400);
    expect(result.pauseRatio).toBe(0);
  });

  it("a gap just over the 400ms threshold counts entirely toward pauseRatio", () => {
    const ws: TimestampedWord[] = [
      { word: "a", start: 0, end: 0.1 },
      { word: "b", start: 0.501, end: 0.6 }, // 401ms gap
    ];
    const result = analyzeAudio(ws);
    expect(result.longestPauseMs).toBe(401);
    // Only gap present, and it's over threshold, so all of it counts: ratio 1.
    expect(result.pauseRatio).toBe(1);
  });

  it("mixes small and large gaps: pauseRatio reflects only the large-gap share of total gap time", () => {
    const ws: TimestampedWord[] = [
      { word: "a", start: 0, end: 0.1 }, // -
      { word: "b", start: 0.2, end: 0.3 }, // gap 100ms (not a pause)
      { word: "c", start: 1.3, end: 1.4 }, // gap 1000ms (a pause)
    ];
    const result = analyzeAudio(ws);
    // totalGapMs = 100 + 1000 = 1100; pauseGapMs = 1000 → ratio = 1000/1100
    expect(result.longestPauseMs).toBe(1000);
    expect(result.pauseRatio).toBeCloseTo(1000 / 1100, 3);
  });

  it("clamps negative gaps (overlapping timestamps) to zero rather than going negative", () => {
    const ws: TimestampedWord[] = [
      { word: "a", start: 0, end: 1 },
      { word: "b", start: 0.5, end: 1.5 }, // starts before "a" ends → negative raw gap
    ];
    const result = analyzeAudio(ws);
    expect(result.longestPauseMs).toBe(0);
    expect(result.pauseRatio).toBe(0);
  });

  it("caps pauseRatio at 1 even if pause math would exceed it", () => {
    // With only pause-length gaps present, ratio should land at exactly 1, not overshoot.
    const ws: TimestampedWord[] = [
      { word: "a", start: 0, end: 0.1 },
      { word: "b", start: 1, end: 1.1 },
      { word: "c", start: 2, end: 2.1 },
    ];
    const result = analyzeAudio(ws);
    expect(result.pauseRatio).toBeLessThanOrEqual(1);
    expect(result.pauseRatio).toBe(1);
  });

  it("zero total gap time (all words touching) yields pauseRatio 0, not NaN", () => {
    const ws: TimestampedWord[] = [
      { word: "a", start: 0, end: 0.5 },
      { word: "b", start: 0.5, end: 1 },
      { word: "c", start: 1, end: 1.5 },
    ];
    const result = analyzeAudio(ws);
    expect(result.pauseRatio).toBe(0);
    expect(result.longestPauseMs).toBe(0);
  });
});

describe("analyzeAudio — filler detection", () => {
  const fillerCases: Array<[string, string[], number]> = [
    ["no fillers present", ["the", "deal", "closed", "yesterday"], 0],
    ["single-token filler 'um'", ["um", "so", "the", "deal"], 1],
    ["single-token filler 'uh'", ["uh", "well"], 1],
    ["single-token filler 'like'", ["it", "was", "like", "great"], 1],
    ["single-token filler 'basically'", ["basically", "we", "won"], 1],
    ["multiple single-token fillers", ["um", "uh", "like", "basically"], 4],
    ["multi-word phrase 'you know'", ["so", "you", "know", "it", "works"], 1],
    ["multi-word phrase 'sort of'", ["it", "was", "sort", "of", "fine"], 1],
    ["multi-word phrase 'kind of'", ["kind", "of", "risky"], 1],
    ["adjacent multi-word phrases both count", ["sort", "of", "kind", "of"], 2],
    ["phrase + single-token filler combine", ["so", "you", "know", "like", "it", "closed"], 2],
    ["fillers as substrings of real words do not false-positive", ["unlike", "uhm"], 0],
  ];

  it.each(fillerCases)("%s → fillerCount %i", (_label, tokens, expected) => {
    const ws = words(tokens);
    expect(analyzeAudio(ws).fillerCount).toBe(expected);
  });

  it("is case-insensitive and strips punctuation before matching", () => {
    const ws: TimestampedWord[] = [
      { word: "Um,", start: 0, end: 0.2 },
      { word: "LIKE.", start: 0.3, end: 0.5 },
      { word: "You're", start: 0.6, end: 0.8 },
    ];
    expect(analyzeAudio(ws).fillerCount).toBe(2);
  });

  it("ignores words that normalize to empty string (pure punctuation tokens)", () => {
    const ws: TimestampedWord[] = [
      { word: "um", start: 0, end: 0.2 },
      { word: "--", start: 0.3, end: 0.4 },
      { word: "ok", start: 0.5, end: 0.6 },
    ];
    const result = analyzeAudio(ws);
    expect(result.fillerCount).toBe(1);
  });
});

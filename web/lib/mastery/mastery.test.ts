import { describe, expect, it } from "vitest";

import { nextReview, updateMastery, weakestTopics } from "./mastery";

describe("updateMastery", () => {
  it("first attempt sets mastery to the attempt score", () => {
    const m = updateMastery(null, "dcf", 80);
    expect(m.attempts).toBe(1);
    expect(m.score).toBeCloseTo(0.8);
  });

  it("moves toward a new score without jumping fully", () => {
    const first = updateMastery(null, "dcf", 100);
    const second = updateMastery(first, "dcf", 0);
    expect(second.score).toBeLessThan(first.score);
    expect(second.score).toBeGreaterThan(0);
    expect(second.attempts).toBe(2);
  });

  it("stays responsive after many attempts (alpha floor)", () => {
    let m = updateMastery(null, "dcf", 100);
    for (let i = 0; i < 30; i++) m = updateMastery(m, "dcf", 100);
    const dropped = updateMastery(m, "dcf", 0);
    expect(m.score - dropped.score).toBeGreaterThanOrEqual(0.1);
  });

  it("weights follow-up attempts more heavily than first attempts", () => {
    const base = { topic: "dcf", score: 0.5, attempts: 10 };
    const viaFirst = updateMastery(base, "dcf", 100, "first");
    const viaFollowup = updateMastery(base, "dcf", 100, "followup");
    expect(viaFollowup.score).toBeGreaterThan(viaFirst.score);
  });

  it("clamps score to [0, 1]", () => {
    const m = updateMastery(null, "dcf", 150);
    expect(m.score).toBeLessThanOrEqual(1);
  });
});

describe("weakestTopics", () => {
  it("returns weakest first and skips low-signal topics", () => {
    const entries = [
      { topic: "dcf", score: 0.9, attempts: 10 },
      { topic: "lbo", score: 0.2, attempts: 5 },
      { topic: "ma", score: 0.1, attempts: 1 }, // below minAttempts — excluded
      { topic: "accounting", score: 0.5, attempts: 4 },
    ];
    const weak = weakestTopics(entries, 2);
    expect(weak.map((e) => e.topic)).toEqual(["lbo", "accounting"]);
  });
});

describe("nextReview", () => {
  const now = new Date("2026-07-12T12:00:00Z");

  it("incorrect answers come back in 2 days", () => {
    const next = nextReview(null, false, now);
    expect(next.intervalDays).toBe(2);
    expect(next.consecutiveCorrect).toBe(0);
    expect(next.nextDueAt.getTime() - now.getTime()).toBe(2 * 86_400_000);
  });

  it("first correct answer comes back in 3 days", () => {
    const next = nextReview({ intervalDays: 2, consecutiveCorrect: 0 }, true, now);
    expect(next.intervalDays).toBe(3);
    expect(next.consecutiveCorrect).toBe(1);
  });

  it("two consecutive correct answers park the question at 14 days", () => {
    const next = nextReview({ intervalDays: 3, consecutiveCorrect: 1 }, true, now);
    expect(next.intervalDays).toBe(14);
    expect(next.consecutiveCorrect).toBe(2);
  });

  it("an incorrect answer resets the streak", () => {
    const next = nextReview({ intervalDays: 14, consecutiveCorrect: 2 }, false, now);
    expect(next.consecutiveCorrect).toBe(0);
    expect(next.intervalDays).toBe(2);
  });
});

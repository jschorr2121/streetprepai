import { describe, expect, it } from "vitest";

import { summarizeActivity } from "./activity";

const NOW = new Date("2026-07-16T15:00:00Z");

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

describe("summarizeActivity", () => {
  it("returns all-quiet summary for no events", () => {
    const s = summarizeActivity([], NOW);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
    expect(s.activeDays).toHaveLength(28);
    expect(s.activeDays.every((d) => !d)).toBe(true);
  });

  it("counts a streak ending today", () => {
    const s = summarizeActivity([daysAgo(0), daysAgo(1), daysAgo(2)], NOW);
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it("keeps the streak alive when today is quiet but yesterday was active", () => {
    const s = summarizeActivity([daysAgo(1), daysAgo(2)], NOW);
    expect(s.currentStreak).toBe(2);
  });

  it("breaks the current streak on a gap before yesterday", () => {
    const s = summarizeActivity([daysAgo(2), daysAgo(3)], NOW);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(2);
  });

  it("finds the longest run anywhere in the window", () => {
    const events = [daysAgo(0), daysAgo(10), daysAgo(11), daysAgo(12), daysAgo(13)];
    const s = summarizeActivity(events, NOW);
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(4);
  });

  it("ignores events outside the window and collapses same-day events", () => {
    const s = summarizeActivity([daysAgo(40), daysAgo(0), daysAgo(0)], NOW);
    expect(s.currentStreak).toBe(1);
    expect(s.activeDays.filter(Boolean)).toHaveLength(1);
    expect(s.activeDays[27]).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const progressRow = {
  id: "gp_001",
  user_id: "user-gp-1",
  guide_slug: "dcf-fundamentals",
  read_at: "2026-04-01T00:00:00.000Z",
  completed: false,
};

describe("getGuideProgress", () => {
  it("returns mapped progress filtered by user_id", async () => {
    sb.setRows([progressRow]);
    const { getGuideProgress } = await import("@/lib/data/guide-progress");
    const list = await getGuideProgress("user-gp-h1");
    expect(sb.from).toHaveBeenCalledWith("guide_progress");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-gp-h1");
    expect(list[0]).toMatchObject({
      id: "gp_001",
      guideSlug: "dcf-fundamentals",
      readAt: "2026-04-01T00:00:00.000Z",
      completed: false,
    });
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getGuideProgress } = await import("@/lib/data/guide-progress");
    expect(await getGuideProgress("user-gp-h2")).toEqual([]);
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { getGuideProgress } = await import("@/lib/data/guide-progress");
    await expect(getGuideProgress("user-gp-h3")).rejects.toMatchObject({
      message: "boom",
    });
  });
});

describe("markGuideRead", () => {
  it("upserts with onConflict and ignoreDuplicates", async () => {
    sb.setRows([]);
    const { markGuideRead } = await import("@/lib/data/guide-progress");
    await markGuideRead("user-mr-1", "wacc-deep-dive");
    expect(sb.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-mr-1",
        guide_slug: "wacc-deep-dive",
      }),
      { onConflict: "user_id,guide_slug", ignoreDuplicates: true },
    );
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { markGuideRead } = await import("@/lib/data/guide-progress");
    await expect(markGuideRead("u", "s")).rejects.toMatchObject({
      message: "rls",
    });
  });
});

describe("markGuideCompleted", () => {
  it("upserts with completed=true", async () => {
    sb.setRows([]);
    const { markGuideCompleted } = await import("@/lib/data/guide-progress");
    await markGuideCompleted("user-mc-1", "lbo-basics");
    expect(sb.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-mc-1",
        guide_slug: "lbo-basics",
        completed: true,
      }),
      { onConflict: "user_id,guide_slug" },
    );
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { markGuideCompleted } = await import("@/lib/data/guide-progress");
    await expect(markGuideCompleted("u", "s")).rejects.toMatchObject({
      message: "boom",
    });
  });
});

describe("getCompletedSlugs", () => {
  it("returns a Set of slugs filtered by user_id and completed=true", async () => {
    sb.setRows([{ guide_slug: "a" }, { guide_slug: "b" }, { guide_slug: "a" }]);
    const { getCompletedSlugs } = await import("@/lib/data/guide-progress");
    const set = await getCompletedSlugs("user-cs-1");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-cs-1");
    expect(sb.eq).toHaveBeenCalledWith("completed", true);
    expect(set).toBeInstanceOf(Set);
    expect(set.has("a")).toBe(true);
    expect(set.has("b")).toBe(true);
    expect(set.size).toBe(2);
  });

  it("returns empty Set when no rows", async () => {
    sb.setRows([]);
    const { getCompletedSlugs } = await import("@/lib/data/guide-progress");
    const set = await getCompletedSlugs("user-cs-2");
    expect(set.size).toBe(0);
  });
});

describe("computeStreak", () => {
  it("returns zeroed result for empty progress", async () => {
    const { computeStreak } = await import("@/lib/data/guide-progress");
    const r = computeStreak([]);
    expect(r.current).toBe(0);
    expect(r.longest).toBe(0);
    expect(r.last28).toHaveLength(28);
    expect(r.last28.every((b) => b === false)).toBe(true);
  });

  it("counts a current streak ending today", async () => {
    const { computeStreak } = await import("@/lib/data/guide-progress");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const list = [
      {
        id: "1",
        guideSlug: "a",
        readAt: today.toISOString(),
        completed: true,
      },
      {
        id: "2",
        guideSlug: "b",
        readAt: yesterday.toISOString(),
        completed: true,
      },
    ];
    const r = computeStreak(list);
    expect(r.current).toBeGreaterThanOrEqual(2);
    expect(r.longest).toBeGreaterThanOrEqual(2);
  });

  it("longest streak does not require today to be active", async () => {
    const { computeStreak } = await import("@/lib/data/guide-progress");
    // 3 days ago, 4 days ago, 5 days ago — a 3-day streak in the past
    const days = [3, 4, 5].map((d) => {
      const dt = new Date();
      dt.setDate(dt.getDate() - d);
      return {
        id: `${d}`,
        guideSlug: "x",
        readAt: dt.toISOString(),
        completed: true,
      };
    });
    const r = computeStreak(days);
    expect(r.longest).toBeGreaterThanOrEqual(3);
    // current should be 0 because today and yesterday are inactive
    expect(r.current).toBe(0);
  });
});

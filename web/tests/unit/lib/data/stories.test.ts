import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const storyRow = {
  id: "st_001",
  user_id: "user-1",
  title: "Led capstone team",
  raw_experience: "We had a team of 5...",
  framings: [{ theme: "leadership", situation: "s", task: "t", action: "a", result: "r" }],
  created_at: "2026-04-01T00:00:00.000Z",
};

describe("getStories", () => {
  it("returns mapped stories ordered by created_at desc", async () => {
    sb.setRows([storyRow]);
    const { getStories } = await import("@/lib/data/stories");
    const list = await getStories("user-st-1");
    expect(sb.from).toHaveBeenCalledWith("stories");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-st-1");
    expect(sb.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(list[0]).toMatchObject({
      id: "st_001",
      title: "Led capstone team",
      rawExperience: "We had a team of 5...",
    });
    expect(list[0].framings).toHaveLength(1);
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getStories } = await import("@/lib/data/stories");
    expect(await getStories("user-st-2")).toEqual([]);
  });

  it("normalizes null framings to []", async () => {
    sb.setRows([{ ...storyRow, framings: null }]);
    const { getStories } = await import("@/lib/data/stories");
    const [s] = await getStories("user-st-3");
    expect(s.framings).toEqual([]);
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { getStories } = await import("@/lib/data/stories");
    await expect(getStories("u")).rejects.toMatchObject({ message: "rls" });
  });
});

describe("saveStory", () => {
  it("inserts and returns the saved story", async () => {
    sb.setRows([storyRow]);
    const { saveStory } = await import("@/lib/data/stories");
    const r = await saveStory("user-save-1", {
      title: "x",
      rawExperience: "y",
      framings: [],
    });
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-save-1",
        title: "x",
        raw_experience: "y",
        framings: [],
      }),
    );
    expect(r.id).toBe("st_001");
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { saveStory } = await import("@/lib/data/stories");
    await expect(
      saveStory("u", { title: "t", rawExperience: "r", framings: [] }),
    ).rejects.toMatchObject({ message: "boom" });
  });
});

describe("updateStoryFramings", () => {
  it("updates framings and filters by id+user_id", async () => {
    sb.setRows([storyRow]);
    const { updateStoryFramings } = await import("@/lib/data/stories");
    const newFramings = [
      { theme: "failure", situation: "s", task: "t", action: "a", result: "r" },
    ] as never;
    await updateStoryFramings("user-upd-1", "st_001", newFramings);
    expect(sb.update).toHaveBeenCalledWith({ framings: newFramings });
    expect(sb.eq).toHaveBeenCalledWith("id", "st_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-upd-1");
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { updateStoryFramings } = await import("@/lib/data/stories");
    await expect(updateStoryFramings("u", "x", [])).rejects.toMatchObject({ message: "boom" });
  });
});

describe("deleteStory", () => {
  it("deletes by id+user_id", async () => {
    sb.setRows([]);
    const { deleteStory } = await import("@/lib/data/stories");
    await deleteStory("user-del-1", "st_001");
    expect(sb.delete).toHaveBeenCalled();
    expect(sb.eq).toHaveBeenCalledWith("id", "st_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-del-1");
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { deleteStory } = await import("@/lib/data/stories");
    await expect(deleteStory("u", "x")).rejects.toMatchObject({
      message: "rls",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const followupRow = {
  id: "fu_001",
  contact_id: "c_001",
  due_at: "2026-04-20T18:00:00.000Z",
  kind: "post-chat",
  note: "send thanks",
  completed_at: null,
};

describe("getFollowups", () => {
  it("returns mapped followups filtered by user_id and incomplete", async () => {
    sb.setRows([followupRow]);
    const { getFollowups } = await import("@/lib/data/followups");
    const list = await getFollowups("user-fu-1");
    expect(sb.from).toHaveBeenCalledWith("followups");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-fu-1");
    expect(sb.is).toHaveBeenCalledWith("completed_at", null);
    expect(sb.order).toHaveBeenCalledWith("due_at");
    expect(list[0]).toMatchObject({
      id: "fu_001",
      contactId: "c_001",
      kind: "post-chat",
      note: "send thanks",
    });
    expect(list[0].completedAt).toBeUndefined();
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getFollowups } = await import("@/lib/data/followups");
    expect(await getFollowups("user-fu-2")).toEqual([]);
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { getFollowups } = await import("@/lib/data/followups");
    await expect(getFollowups("u")).rejects.toMatchObject({ message: "rls" });
  });
});

describe("createFollowup", () => {
  it("inserts and returns mapped row", async () => {
    sb.setRows([followupRow]);
    const { createFollowup } = await import("@/lib/data/followups");
    const fu = await createFollowup("user-cfu-1", {
      contactId: "c_001",
      dueAt: "2026-04-20T18:00:00.000Z",
      kind: "post-chat",
      note: "send thanks",
    });
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-cfu-1",
        contact_id: "c_001",
        kind: "post-chat",
        note: "send thanks",
      }),
    );
    expect(fu.id).toBe("fu_001");
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { createFollowup } = await import("@/lib/data/followups");
    await expect(
      createFollowup("u", {
        contactId: "c",
        dueAt: "2026-01-01",
        kind: "outreach",
        note: "hi",
      }),
    ).rejects.toMatchObject({ message: "boom" });
  });
});

describe("completeFollowup", () => {
  it("updates completed_at and filters by id+user_id", async () => {
    sb.setRows([]);
    const { completeFollowup } = await import("@/lib/data/followups");
    await completeFollowup("user-comp-1", "fu_001");
    const updateRow = sb.update.mock.calls[0]![0] as Record<string, unknown>;
    expect(updateRow).toHaveProperty("completed_at");
    expect(sb.eq).toHaveBeenCalledWith("id", "fu_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-comp-1");
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { completeFollowup } = await import("@/lib/data/followups");
    await expect(completeFollowup("u", "x")).rejects.toMatchObject({
      message: "rls",
    });
  });
});

describe("deleteFollowup", () => {
  it("deletes by id+user_id", async () => {
    sb.setRows([]);
    const { deleteFollowup } = await import("@/lib/data/followups");
    await deleteFollowup("user-del-1", "fu_001");
    expect(sb.delete).toHaveBeenCalled();
    expect(sb.eq).toHaveBeenCalledWith("id", "fu_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-del-1");
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { deleteFollowup } = await import("@/lib/data/followups");
    await expect(deleteFollowup("u", "x")).rejects.toMatchObject({
      message: "rls",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const appliedRow = {
  id: "aj_001",
  firm: "Goldman Sachs",
  role: "SA",
  group_name: "TMT",
  deadline: "2026-08-15",
  url: "https://gs.com",
  stage: "applied",
  notes: "submitted",
  added_at: "2026-04-01T00:00:00.000Z",
};

describe("getAppliedJobs", () => {
  it("returns mapped jobs filtered by user_id and ordered by added_at desc", async () => {
    sb.setRows([appliedRow]);
    const { getAppliedJobs } = await import("@/lib/data/applied-jobs");
    const jobs = await getAppliedJobs("user-aj-1");
    expect(sb.from).toHaveBeenCalledWith("applied_jobs");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-aj-1");
    expect(sb.order).toHaveBeenCalledWith("added_at", { ascending: false });
    expect(jobs[0]).toMatchObject({
      id: "aj_001",
      firm: "Goldman Sachs",
      role: "SA",
      group: "TMT",
      stage: "applied",
      addedAt: "2026-04-01T00:00:00.000Z",
    });
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getAppliedJobs } = await import("@/lib/data/applied-jobs");
    expect(await getAppliedJobs("user-aj-2")).toEqual([]);
  });

  it("normalizes nullable columns", async () => {
    sb.setRows([{ ...appliedRow, group_name: null, deadline: null, url: null, notes: null }]);
    const { getAppliedJobs } = await import("@/lib/data/applied-jobs");
    const [j] = await getAppliedJobs("user-aj-3");
    expect(j.group).toBeUndefined();
    expect(j.deadline).toBeUndefined();
    expect(j.url).toBeUndefined();
    expect(j.notes).toBeUndefined();
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { getAppliedJobs } = await import("@/lib/data/applied-jobs");
    await expect(getAppliedJobs("user-aj-4")).rejects.toMatchObject({
      message: "rls",
    });
  });
});

describe("addAppliedJob", () => {
  it("inserts mapped row and returns the inserted job", async () => {
    sb.setRows([appliedRow]);
    const { addAppliedJob } = await import("@/lib/data/applied-jobs");
    const result = await addAppliedJob("user-add-1", {
      firm: "Goldman Sachs",
      role: "SA",
      group: "TMT",
      deadline: "2026-08-15",
      url: "https://gs.com",
      stage: "applied",
      notes: "submitted",
    });
    expect(sb.from).toHaveBeenCalledWith("applied_jobs");
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-add-1",
        firm: "Goldman Sachs",
        role: "SA",
        group_name: "TMT",
        stage: "applied",
        notes: "submitted",
      }),
    );
    expect(result.id).toBe("aj_001");
  });

  it("converts undefined optional fields to null in insert payload", async () => {
    sb.setRows([appliedRow]);
    const { addAppliedJob } = await import("@/lib/data/applied-jobs");
    await addAppliedJob("user-add-2", {
      firm: "Evercore",
      role: "SA",
      stage: "applied",
    });
    expect(sb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        group_name: null,
        deadline: null,
        url: null,
        notes: null,
      }),
    );
  });

  it("throws on insert error", async () => {
    sb.setRows([], { message: "duplicate" });
    const { addAppliedJob } = await import("@/lib/data/applied-jobs");
    await expect(
      addAppliedJob("user-add-3", { firm: "x", role: "y", stage: "applied" }),
    ).rejects.toMatchObject({ message: "duplicate" });
  });
});

describe("updateAppliedJob", () => {
  it("only writes changed fields and filters by id+user_id", async () => {
    sb.setRows([appliedRow]);
    const { updateAppliedJob } = await import("@/lib/data/applied-jobs");
    await updateAppliedJob("user-upd-1", "aj_001", {
      stage: "interview",
      notes: "round 1 done",
    });
    expect(sb.update).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "interview",
        notes: "round 1 done",
      }),
    );
    const updateCall = sb.update.mock.calls[0]![0] as Record<string, unknown>;
    expect(updateCall).not.toHaveProperty("firm");
    expect(updateCall).toHaveProperty("updated_at");
    expect(sb.eq).toHaveBeenCalledWith("id", "aj_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-upd-1");
  });

  it("translates undefined group/deadline/url/notes to null when explicitly provided", async () => {
    sb.setRows([appliedRow]);
    const { updateAppliedJob } = await import("@/lib/data/applied-jobs");
    await updateAppliedJob("user-upd-2", "aj_001", {
      group: undefined,
      deadline: undefined,
    });
    // group/deadline are undefined in patch — should NOT appear in row
    const row = sb.update.mock.calls[0]![0] as Record<string, unknown>;
    expect(row).not.toHaveProperty("group_name");
    expect(row).not.toHaveProperty("deadline");
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "denied" });
    const { updateAppliedJob } = await import("@/lib/data/applied-jobs");
    await expect(
      updateAppliedJob("user-upd-3", "aj_001", { stage: "rejected" }),
    ).rejects.toMatchObject({ message: "denied" });
  });
});

describe("removeAppliedJob", () => {
  it("deletes by id+user_id", async () => {
    sb.setRows([]);
    const { removeAppliedJob } = await import("@/lib/data/applied-jobs");
    await removeAppliedJob("user-del-1", "aj_001");
    expect(sb.delete).toHaveBeenCalled();
    expect(sb.eq).toHaveBeenCalledWith("id", "aj_001");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-del-1");
  });

  it("throws on delete error", async () => {
    sb.setRows([], { message: "rls" });
    const { removeAppliedJob } = await import("@/lib/data/applied-jobs");
    await expect(removeAppliedJob("user-del-2", "aj_x")).rejects.toMatchObject({ message: "rls" });
  });
});

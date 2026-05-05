import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const jobRow = {
  id: "j_001",
  firm: "Goldman Sachs",
  role: "Summer Analyst",
  group_name: "TMT",
  location: "NYC",
  year_target: "2027",
  deadline: "2026-08-15",
  url: "https://gs.com/apply",
  tags: ["BB", "tech"],
};

describe("getJobs", () => {
  it("returns mapped jobs ordered by deadline", async () => {
    sb.setRows([jobRow]);
    const { getJobs } = await import("@/lib/data/jobs");
    const jobs = await getJobs();
    expect(sb.from).toHaveBeenCalledWith("jobs");
    expect(sb.order).toHaveBeenCalledWith("deadline", {
      ascending: true,
      nullsFirst: false,
    });
    expect(jobs[0]).toMatchObject({
      id: "j_001",
      firm: "Goldman Sachs",
      role: "Summer Analyst",
      group: "TMT",
      yearTarget: "2027",
      deadline: "2026-08-15",
      tags: ["BB", "tech"],
    });
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getJobs } = await import("@/lib/data/jobs");
    expect(await getJobs()).toEqual([]);
  });

  it("normalizes nullable group/deadline/tags", async () => {
    sb.setRows([{ ...jobRow, group_name: null, deadline: null, tags: null }]);
    const { getJobs } = await import("@/lib/data/jobs");
    const [j] = await getJobs();
    expect(j.group).toBeUndefined();
    expect(j.deadline).toBeUndefined();
    expect(j.tags).toEqual([]);
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { getJobs } = await import("@/lib/data/jobs");
    await expect(getJobs()).rejects.toMatchObject({ message: "boom" });
  });
});

describe("allTiers", () => {
  it("exposes the tier list", async () => {
    const { allTiers } = await import("@/lib/data/jobs");
    expect(allTiers).toEqual(["BB", "EB", "MM"]);
  });
});

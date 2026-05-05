import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const profileRow = {
  user_id: "user-p-1",
  full_name: "Jane Test",
  school: "Wharton",
  graduation_year: 2027,
  target_roles: ["IB SA"],
  target_firms: ["GS"],
  bio_summary: "Junior at Wharton",
  resume_raw_text: "Wharton 2027",
  experiences: [],
  education: [],
  skills: ["Excel"],
  updated_at: "2026-04-01T00:00:00.000Z",
};

describe("getProfile", () => {
  it("returns mapped profile filtered by user_id", async () => {
    sb.setRows([profileRow]);
    const { getProfile } = await import("@/lib/data/profile");
    const p = await getProfile("user-prof-1");
    expect(sb.from).toHaveBeenCalledWith("profiles");
    expect(sb.eq).toHaveBeenCalledWith("user_id", "user-prof-1");
    expect(sb.maybeSingle).toHaveBeenCalled();
    expect(p).toMatchObject({
      userId: "user-p-1",
      fullName: "Jane Test",
      school: "Wharton",
      graduationYear: 2027,
      targetRoles: ["IB SA"],
      skills: ["Excel"],
    });
  });

  it("returns empty profile when no row found", async () => {
    sb.setRows([]);
    const { getProfile } = await import("@/lib/data/profile");
    const p = await getProfile("user-prof-empty");
    expect(p.userId).toBe("user-prof-empty");
    expect(p.targetRoles).toEqual([]);
    expect(p.targetFirms).toEqual([]);
    expect(p.experiences).toEqual([]);
    expect(p.education).toEqual([]);
    expect(p.skills).toEqual([]);
    expect(p.fullName).toBeUndefined();
  });

  it("normalizes null array columns to []", async () => {
    sb.setRows([
      {
        ...profileRow,
        target_roles: null,
        target_firms: null,
        experiences: null,
        education: null,
        skills: null,
        full_name: null,
      },
    ]);
    const { getProfile } = await import("@/lib/data/profile");
    const p = await getProfile("user-prof-null");
    expect(p.targetRoles).toEqual([]);
    expect(p.targetFirms).toEqual([]);
    expect(p.skills).toEqual([]);
    expect(p.fullName).toBeUndefined();
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "rls" });
    const { getProfile } = await import("@/lib/data/profile");
    await expect(getProfile("u")).rejects.toMatchObject({ message: "rls" });
  });
});

describe("upsertProfile", () => {
  it("upserts with onConflict=user_id and only writes provided patch fields", async () => {
    sb.setRows([profileRow]);
    const { upsertProfile } = await import("@/lib/data/profile");
    const r = await upsertProfile("user-up-1", {
      fullName: "New Name",
      skills: ["Python"],
    });
    expect(sb.upsert).toHaveBeenCalled();
    const [row, opts] = sb.upsert.mock.calls[0]!;
    expect(opts).toEqual({ onConflict: "user_id" });
    expect(row).toMatchObject({
      user_id: "user-up-1",
      full_name: "New Name",
      skills: ["Python"],
    });
    expect(row).toHaveProperty("updated_at");
    expect(row).not.toHaveProperty("school");
    expect(r.userId).toBe("user-p-1");
  });

  it("writes every field when full patch provided", async () => {
    sb.setRows([profileRow]);
    const { upsertProfile } = await import("@/lib/data/profile");
    await upsertProfile("user-up-2", {
      fullName: "x",
      school: "MIT",
      graduationYear: 2028,
      targetRoles: ["a"],
      targetFirms: ["GS"],
      bioSummary: "b",
      resumeRawText: "r",
      experiences: [],
      education: [],
      skills: ["s"],
    });
    const row = sb.upsert.mock.calls[0]![0] as Record<string, unknown>;
    expect(row.full_name).toBe("x");
    expect(row.school).toBe("MIT");
    expect(row.graduation_year).toBe(2028);
    expect(row.target_roles).toEqual(["a"]);
    expect(row.target_firms).toEqual(["GS"]);
    expect(row.bio_summary).toBe("b");
    expect(row.resume_raw_text).toBe("r");
    expect(row.experiences).toEqual([]);
    expect(row.education).toEqual([]);
    expect(row.skills).toEqual(["s"]);
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "boom" });
    const { upsertProfile } = await import("@/lib/data/profile");
    await expect(upsertProfile("u", { fullName: "x" })).rejects.toMatchObject({ message: "boom" });
  });
});

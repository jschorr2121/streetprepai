import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = await vi.hoisted(async () => {
  const mod = await import("./_supabase-mock");
  return mod.buildSupabaseMockGraph();
});
vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));

beforeEach(() => sb.reset());

const firmRow = {
  slug: "goldman-sachs",
  name: "Goldman Sachs",
  tier: "BB",
  hq: "New York",
  description: "Bulge bracket bank",
  latest_earnings_raw: "Q4 ...",
};

describe("getAllFirms", () => {
  it("returns all firms ordered by name", async () => {
    sb.setRows([firmRow]);
    const { getAllFirms } = await import("@/lib/data/firms");
    const firms = await getAllFirms();
    expect(sb.from).toHaveBeenCalledWith("firms");
    expect(sb.order).toHaveBeenCalledWith("name");
    expect(firms).toHaveLength(1);
    expect(firms[0]).toMatchObject({
      slug: "goldman-sachs",
      name: "Goldman Sachs",
      tier: "BB",
      latestEarningsRaw: "Q4 ...",
    });
  });

  it("returns [] when no rows", async () => {
    sb.setRows([]);
    const { getAllFirms } = await import("@/lib/data/firms");
    expect(await getAllFirms()).toEqual([]);
  });

  it("throws on error", async () => {
    sb.setRows([], { message: "fail" });
    const { getAllFirms } = await import("@/lib/data/firms");
    await expect(getAllFirms()).rejects.toMatchObject({ message: "fail" });
  });
});

describe("getFirmBySlug", () => {
  it("returns mapped firm via maybeSingle", async () => {
    sb.setRows([firmRow]);
    const { getFirmBySlug } = await import("@/lib/data/firms");
    const firm = await getFirmBySlug("goldman-sachs");
    expect(sb.eq).toHaveBeenCalledWith("slug", "goldman-sachs");
    expect(sb.maybeSingle).toHaveBeenCalled();
    expect(firm?.name).toBe("Goldman Sachs");
  });

  it("returns null when not found", async () => {
    sb.setRows([]);
    const { getFirmBySlug } = await import("@/lib/data/firms");
    expect(await getFirmBySlug("missing")).toBeNull();
  });

  it("normalizes null latest_earnings_raw to undefined", async () => {
    sb.setRows([{ ...firmRow, latest_earnings_raw: null }]);
    const { getFirmBySlug } = await import("@/lib/data/firms");
    const firm = await getFirmBySlug("gs-2");
    expect(firm?.latestEarningsRaw).toBeUndefined();
  });
});

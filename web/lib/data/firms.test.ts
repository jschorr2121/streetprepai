import { describe, expect, it } from "vitest";

import { matchFirm } from "./firms";
import type { Firm } from "@/lib/types";

const FIRMS: Firm[] = [
  {
    slug: "goldman-sachs",
    name: "Goldman Sachs",
    tier: "BB" as Firm["tier"],
    hq: "NYC",
    description: "",
  },
  { slug: "jpmorgan", name: "J.P. Morgan", tier: "BB" as Firm["tier"], hq: "NYC", description: "" },
  { slug: "evercore", name: "Evercore", tier: "EB" as Firm["tier"], hq: "NYC", description: "" },
  {
    slug: "morgan-stanley",
    name: "Morgan Stanley",
    tier: "BB" as Firm["tier"],
    hq: "NYC",
    description: "",
  },
];

describe("matchFirm", () => {
  it("matches an exact slug", () => {
    expect(matchFirm(FIRMS, "goldman-sachs")?.name).toBe("Goldman Sachs");
  });

  it("matches an exact name case-insensitively (punctuation ignored)", () => {
    expect(matchFirm(FIRMS, "jp morgan")?.slug).toBe("jpmorgan");
    expect(matchFirm(FIRMS, "GOLDMAN SACHS")?.slug).toBe("goldman-sachs");
  });

  it("matches common abbreviations via word initials", () => {
    expect(matchFirm(FIRMS, "JPM")?.slug).toBe("jpmorgan");
    expect(matchFirm(FIRMS, "GS")?.slug).toBe("goldman-sachs");
    expect(matchFirm(FIRMS, "MS")?.slug).toBe("morgan-stanley");
  });

  it("falls back to a substring match", () => {
    expect(matchFirm(FIRMS, "evercor")?.slug).toBe("evercore");
    expect(matchFirm(FIRMS, "stanley")?.slug).toBe("morgan-stanley");
  });

  it("prefers name-prefix over substring when both could apply", () => {
    // "morgan" prefixes Morgan Stanley; it's also a substring of J.P. Morgan.
    expect(matchFirm(FIRMS, "morgan")?.slug).toBe("morgan-stanley");
  });

  it("returns null for unknown or empty queries", () => {
    expect(matchFirm(FIRMS, "centerview")).toBeNull();
    expect(matchFirm(FIRMS, "  ")).toBeNull();
  });
});

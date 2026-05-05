/**
 * Filesystem-backed test: runs against the real markdown in `content/guides/`.
 * The harness's working directory is `web/`, so `process.cwd()` resolves the
 * production `GUIDES_DIR` correctly.
 */
import { describe, expect, it } from "vitest";
import { getAllGuides, getGuideBySlug, parseSections, categoryLabels } from "@/lib/data/guides";

describe("getAllGuides", () => {
  it("returns at least one guide and matches the Guide shape", () => {
    const guides = getAllGuides();
    expect(guides.length).toBeGreaterThan(0);
    const g = guides[0]!;
    expect(typeof g.slug).toBe("string");
    expect(typeof g.title).toBe("string");
    expect(typeof g.description).toBe("string");
    expect(typeof g.category).toBe("string");
    expect(typeof g.difficulty).toBe("string");
    expect(typeof g.readingMinutes).toBe("number");
    expect(Array.isArray(g.tags)).toBe(true);
    expect(typeof g.content).toBe("string");
  });

  it("returns guides sorted alphabetically by title", () => {
    const guides = getAllGuides();
    const titles = guides.map((g) => g.title);
    const sorted = [...titles].sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sorted);
  });

  it("memoizes — second call returns the same array reference", () => {
    const a = getAllGuides();
    const b = getAllGuides();
    expect(b).toBe(a);
  });
});

describe("getGuideBySlug", () => {
  it("returns the guide for a known slug", () => {
    // accounting-linkages is a stable seed file in the prototype.
    const g = getGuideBySlug("accounting-linkages");
    expect(g).not.toBeNull();
    expect(g?.slug).toBe("accounting-linkages");
    expect(g?.content.length).toBeGreaterThan(0);
  });

  it("returns null for an unknown slug", () => {
    const g = getGuideBySlug("definitely-not-a-real-guide-zzz-1234");
    expect(g).toBeNull();
  });
});

describe("parseSections", () => {
  it("splits on H2 and H3 headings", () => {
    const md = [
      "Intro paragraph.",
      "",
      "## First Heading",
      "First body.",
      "",
      "### Sub Heading",
      "Sub body.",
      "",
      "## Second Heading",
      "Second body.",
    ].join("\n");
    const sections = parseSections(md);
    expect(sections.length).toBe(4);
    expect(sections[0].id).toBe("preamble");
    expect(sections[0].heading).toBe("Overview");
    expect(sections[1].heading).toBe("First Heading");
    expect(sections[1].level).toBe(2);
    expect(sections[2].heading).toBe("Sub Heading");
    expect(sections[2].level).toBe(3);
    expect(sections[3].heading).toBe("Second Heading");
    expect(sections[3].content).toContain("Second body.");
  });

  it("does not emit a preamble when content starts with a heading", () => {
    const md = "## Only Heading\nbody";
    const sections = parseSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("Only Heading");
  });

  it("returns empty array for empty content", () => {
    expect(parseSections("")).toEqual([]);
  });

  it("slugifies headings into ids (lowercase, dashed, alnum-only)", () => {
    const md = "## What's a DCF?\nbody";
    const sections = parseSections(md);
    expect(sections[0].id).toBe("what-s-a-dcf");
  });
});

describe("categoryLabels", () => {
  it("maps every documented category to a non-empty label", () => {
    for (const v of Object.values(categoryLabels)) {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    }
  });
});

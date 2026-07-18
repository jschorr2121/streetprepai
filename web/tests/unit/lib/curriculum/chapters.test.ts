import { describe, expect, it } from "vitest";

import {
  chapters,
  coreSections,
  getChapter,
  getSection,
  spineChapters,
} from "@/lib/curriculum/chapters";

describe("getChapter", () => {
  it("returns the chapter matching the given slug", () => {
    const chapter = getChapter("dcf");
    expect(chapter).not.toBeNull();
    expect(chapter?.title).toBe("DCF Analysis");
    expect(chapter?.kind).toBe("spine");
  });

  it("returns null for an unknown slug", () => {
    expect(getChapter("does-not-exist")).toBeNull();
  });
});

describe("getSection", () => {
  it("returns the chapter, section, and index for a valid chapter+section pair", () => {
    const result = getSection("dcf", "terminal-value");
    expect(result).not.toBeNull();
    expect(result?.chapter.slug).toBe("dcf");
    expect(result?.section.title).toBe("Terminal value");
    expect(result?.index).toBe(3);
  });

  it("returns null when the chapter slug doesn't exist", () => {
    expect(getSection("nonexistent-chapter", "terminal-value")).toBeNull();
  });

  it("returns null when the chapter exists but the section slug doesn't", () => {
    expect(getSection("dcf", "nonexistent-section")).toBeNull();
  });
});

describe("spineChapters", () => {
  it("returns only chapters with kind 'spine', in declaration order", () => {
    const spine = spineChapters();
    expect(spine.length).toBeGreaterThan(0);
    expect(spine.every((c) => c.kind === "spine")).toBe(true);
    // Reference chapters are excluded.
    expect(spine.some((c) => c.slug === "firms")).toBe(false);
    expect(spine.some((c) => c.slug === "sectors")).toBe(false);
    // Order matches the manifest's declaration order (by chapter number).
    const spineSlugsInFullOrder = chapters.filter((c) => c.kind === "spine").map((c) => c.slug);
    expect(spine.map((c) => c.slug)).toEqual(spineSlugsInFullOrder);
  });
});

describe("coreSections", () => {
  it("excludes advanced sections", () => {
    const accounting = getChapter("accounting")!;
    const core = coreSections(accounting);
    expect(core.some((s) => s.advanced)).toBe(false);
    expect(core.length).toBe(accounting.sections.length - 1);
    expect(core.some((s) => s.slug === "advanced-accounting")).toBe(false);
  });

  it("returns every section when a chapter has no advanced sections", () => {
    const recruitingCycle = getChapter("recruiting-cycle")!;
    expect(recruitingCycle.sections.every((s) => !s.advanced)).toBe(true);
    const core = coreSections(recruitingCycle);
    expect(core).toEqual(recruitingCycle.sections);
  });

  it("excludes multiple advanced sections (lbo has two)", () => {
    const lbo = getChapter("lbo")!;
    const advancedCount = lbo.sections.filter((s) => s.advanced).length;
    expect(advancedCount).toBe(2);
    const core = coreSections(lbo);
    expect(core.length).toBe(lbo.sections.length - advancedCount);
  });
});

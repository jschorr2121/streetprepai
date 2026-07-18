import { describe, expect, it } from "vitest";

import { chapters, coreSections, spineChapters } from "@/lib/curriculum/chapters";
import { computeFlow } from "@/lib/curriculum/progress";
import type { ChapterProgressEntry, SectionProgressEntry } from "@/lib/types";

// Real curriculum data drives these tests — no fixtures/mocks. We assert
// against the actual first spine chapter / first core section rather than
// hardcoding slugs that could drift, but pin a couple of known real slugs
// ("recruiting-cycle", "accounting") since the spine order matters here.

const firstSpine = spineChapters()[0]!;
const firstSpineFirstCore = coreSections(firstSpine)[0]!;
const secondSpine = spineChapters()[1]!;
const secondSpineFirstCore = coreSections(secondSpine)[0]!;

describe("computeFlow — no progress at all", () => {
  it("every chapter shows zero progress and nextUp points at the first spine chapter's first core section", () => {
    const flow = computeFlow([], []);
    expect(flow.statuses).toHaveLength(chapters.length);
    for (const status of flow.statuses) {
      expect(status.sectionsRead).toBe(0);
      expect(status.drillsDone).toBe(0);
      expect(status.gatePassed).toBe(false);
      expect(status.completed).toBe(false);
      expect(status.readFraction).toBe(0);
      expect(status.coreCount).toBe(coreSections(status.chapter).length);
    }
    expect(flow.nextUp).toEqual({
      chapter: firstSpine,
      sectionSlug: firstSpineFirstCore.slug,
      sectionTitle: firstSpineFirstCore.title,
    });
  });
});

describe("computeFlow — partial progress within a chapter", () => {
  it("counts only core sections toward sectionsRead/drillsDone and computes readFraction", () => {
    const core = coreSections(firstSpine);
    const sectionProgress: SectionProgressEntry[] = [
      { chapterSlug: firstSpine.slug, sectionSlug: core[0]!.slug, readAt: "2026-01-01T00:00:00Z" },
    ];
    const flow = computeFlow(sectionProgress, []);
    const status = flow.statuses.find((s) => s.chapter.slug === firstSpine.slug)!;
    expect(status.sectionsRead).toBe(1);
    expect(status.readFraction).toBeCloseTo(1 / core.length);
    expect(status.drillsDone).toBe(0);
    // nextUp should be the next unread core section within the same chapter.
    expect(flow.nextUp).toEqual({
      chapter: firstSpine,
      sectionSlug: core[1]!.slug,
      sectionTitle: core[1]!.title,
    });
  });

  it("counts drillCompletedAt toward drillsDone independently of readAt", () => {
    const core = coreSections(firstSpine);
    const sectionProgress: SectionProgressEntry[] = [
      {
        chapterSlug: firstSpine.slug,
        sectionSlug: core[0]!.slug,
        drillCompletedAt: "2026-01-01T00:00:00Z",
      },
    ];
    const flow = computeFlow(sectionProgress, []);
    const status = flow.statuses.find((s) => s.chapter.slug === firstSpine.slug)!;
    expect(status.drillsDone).toBe(1);
    expect(status.sectionsRead).toBe(0);
  });

  it("ignores advanced sections when computing coreCount/sectionsRead (accounting chapter has one)", () => {
    const accounting = chapters.find((c) => c.slug === "accounting")!;
    const advancedSection = accounting.sections.find((s) => s.advanced)!;
    expect(advancedSection).toBeDefined();
    const sectionProgress: SectionProgressEntry[] = [
      {
        chapterSlug: "accounting",
        sectionSlug: advancedSection.slug,
        readAt: "2026-01-01T00:00:00Z",
      },
    ];
    const flow = computeFlow(sectionProgress, []);
    const status = flow.statuses.find((s) => s.chapter.slug === "accounting")!;
    // Reading only the advanced section doesn't move sectionsRead since it's excluded from core.
    expect(status.sectionsRead).toBe(0);
    expect(status.coreCount).toBe(coreSections(accounting).length);
  });
});

describe("computeFlow — chapter fully read but not completed", () => {
  it("nextUp re-points at the chapter's first core section (gate/finish step) rather than advancing", () => {
    const core = coreSections(firstSpine);
    const sectionProgress: SectionProgressEntry[] = core.map((s) => ({
      chapterSlug: firstSpine.slug,
      sectionSlug: s.slug,
      readAt: "2026-01-01T00:00:00Z",
    }));
    const flow = computeFlow(sectionProgress, []);
    const status = flow.statuses.find((s) => s.chapter.slug === firstSpine.slug)!;
    expect(status.sectionsRead).toBe(core.length);
    expect(status.readFraction).toBe(1);
    expect(status.completed).toBe(false);
    expect(flow.nextUp).toEqual({
      chapter: firstSpine,
      sectionSlug: core[0]!.slug,
      sectionTitle: core[0]!.title,
    });
  });
});

describe("computeFlow — chapter completed", () => {
  it("gatePassed/completed reflect chapterProgress, and nextUp advances to the next spine chapter", () => {
    const chapterProgress: ChapterProgressEntry[] = [
      {
        chapterSlug: firstSpine.slug,
        gatePassedAt: "2026-01-01T00:00:00Z",
        completedAt: "2026-01-02T00:00:00Z",
      },
    ];
    const flow = computeFlow([], chapterProgress);
    const status = flow.statuses.find((s) => s.chapter.slug === firstSpine.slug)!;
    expect(status.gatePassed).toBe(true);
    expect(status.completed).toBe(true);
    expect(flow.nextUp).toEqual({
      chapter: secondSpine,
      sectionSlug: secondSpineFirstCore.slug,
      sectionTitle: secondSpineFirstCore.title,
    });
  });

  it("nextUp is null once every spine chapter is completed", () => {
    const chapterProgress: ChapterProgressEntry[] = spineChapters().map((c) => ({
      chapterSlug: c.slug,
      completedAt: "2026-01-01T00:00:00Z",
    }));
    const flow = computeFlow([], chapterProgress);
    expect(flow.nextUp).toBeNull();
    for (const c of spineChapters()) {
      const status = flow.statuses.find((s) => s.chapter.slug === c.slug)!;
      expect(status.completed).toBe(true);
    }
  });

  it("reference chapters (e.g. firms/sectors) are excluded from the spine walk entirely", () => {
    const referenceChapter = chapters.find((c) => c.kind === "reference")!;
    expect(referenceChapter).toBeDefined();
    expect(spineChapters().some((c) => c.slug === referenceChapter.slug)).toBe(false);
  });
});

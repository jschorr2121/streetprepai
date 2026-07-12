// Derives learning-flow state from stored progress rows — pure, no DB. The
// pages fetch the raw rows via lib/db/queries/curriculum and pass them here.

import {
  chapters,
  coreSections,
  spineChapters,
  type ChapterDef,
} from "@/lib/curriculum/chapters";
import type { ChapterProgressEntry, SectionProgressEntry } from "@/lib/types";

export type ChapterStatus = {
  chapter: ChapterDef;
  sectionsRead: number;
  coreCount: number;
  drillsDone: number;
  gatePassed: boolean;
  completed: boolean;
  /** 0–1 across core sections read. */
  readFraction: number;
};

export type FlowState = {
  statuses: ChapterStatus[];
  /** Next thing to do in the linear spine, or null if everything is done. */
  nextUp: { chapter: ChapterDef; sectionSlug: string; sectionTitle: string } | null;
};

export function computeFlow(
  sectionProgress: SectionProgressEntry[],
  chapterProgress: ChapterProgressEntry[],
): FlowState {
  const readSet = new Set(sectionProgress.filter((s) => s.readAt).map((s) => key(s.chapterSlug, s.sectionSlug)));
  const drillSet = new Set(
    sectionProgress.filter((s) => s.drillCompletedAt).map((s) => key(s.chapterSlug, s.sectionSlug)),
  );
  const chapterMap = new Map(chapterProgress.map((c) => [c.chapterSlug, c]));

  const statuses: ChapterStatus[] = chapters.map((chapter) => {
    const core = coreSections(chapter);
    const sectionsRead = core.filter((s) => readSet.has(key(chapter.slug, s.slug))).length;
    const drillsDone = core.filter((s) => drillSet.has(key(chapter.slug, s.slug))).length;
    const cp = chapterMap.get(chapter.slug);
    return {
      chapter,
      sectionsRead,
      coreCount: core.length,
      drillsDone,
      gatePassed: !!cp?.gatePassedAt,
      completed: !!cp?.completedAt,
      readFraction: core.length > 0 ? sectionsRead / core.length : 0,
    };
  });

  const statusBySlug = new Map(statuses.map((s) => [s.chapter.slug, s]));

  // Next up: first spine chapter that isn't complete, then its first unread core section.
  let nextUp: FlowState["nextUp"] = null;
  for (const chapter of spineChapters()) {
    const st = statusBySlug.get(chapter.slug)!;
    if (st.completed) continue;
    const unread = coreSections(chapter).find((s) => !readSet.has(key(chapter.slug, s.slug)));
    if (unread) {
      nextUp = { chapter, sectionSlug: unread.slug, sectionTitle: unread.title };
    } else {
      // All read but not complete — point at the gate/finish step's first section.
      const first = coreSections(chapter)[0];
      if (first) nextUp = { chapter, sectionSlug: first.slug, sectionTitle: first.title };
    }
    break;
  }

  return { statuses, nextUp };
}

function key(chapterSlug: string, sectionSlug: string): string {
  return `${chapterSlug}::${sectionSlug}`;
}

import { and, eq } from "drizzle-orm";

import type { Executor } from "@/lib/db/client";
import { chapterProgress, sectionProgress, topicMastery } from "@/lib/db/schema";
import type { ChapterProgressEntry, SectionProgressEntry, TopicMasteryEntry } from "@/lib/types";

// ─── Section progress ─────────────────────────────────────────────────────────

export async function listSectionProgress(
  db: Executor,
  userId: string,
): Promise<SectionProgressEntry[]> {
  const rows = await db.select().from(sectionProgress).where(eq(sectionProgress.userId, userId));
  return rows.map((r) => ({
    chapterSlug: r.chapterSlug,
    sectionSlug: r.sectionSlug,
    readAt: r.readAt ?? undefined,
    drillScore: r.drillScore != null ? Number(r.drillScore) : undefined,
    drillCompletedAt: r.drillCompletedAt ?? undefined,
  }));
}

export async function markSectionRead(
  db: Executor,
  userId: string,
  chapterSlug: string,
  sectionSlug: string,
): Promise<void> {
  await db
    .insert(sectionProgress)
    .values({ userId, chapterSlug, sectionSlug, readAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: [sectionProgress.userId, sectionProgress.chapterSlug, sectionProgress.sectionSlug],
      set: { readAt: new Date().toISOString() },
    });
}

export async function recordSectionDrill(
  db: Executor,
  userId: string,
  chapterSlug: string,
  sectionSlug: string,
  score: number,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insert(sectionProgress)
    .values({
      userId,
      chapterSlug,
      sectionSlug,
      readAt: now,
      drillScore: score.toFixed(2),
      drillCompletedAt: now,
    })
    .onConflictDoUpdate({
      target: [sectionProgress.userId, sectionProgress.chapterSlug, sectionProgress.sectionSlug],
      set: { drillScore: score.toFixed(2), drillCompletedAt: now },
    });
}

// ─── Chapter progress (gates) ─────────────────────────────────────────────────

export async function listChapterProgress(
  db: Executor,
  userId: string,
): Promise<ChapterProgressEntry[]> {
  const rows = await db.select().from(chapterProgress).where(eq(chapterProgress.userId, userId));
  return rows.map((r) => ({
    chapterSlug: r.chapterSlug,
    gateScore: r.gateScore != null ? Number(r.gateScore) : undefined,
    gatePassedAt: r.gatePassedAt ?? undefined,
    completedAt: r.completedAt ?? undefined,
  }));
}

export async function recordGateResult(
  db: Executor,
  userId: string,
  chapterSlug: string,
  score: number,
  passed: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insert(chapterProgress)
    .values({
      userId,
      chapterSlug,
      gateScore: score.toFixed(2),
      gatePassedAt: passed ? now : null,
      completedAt: passed ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [chapterProgress.userId, chapterProgress.chapterSlug],
      set: passed
        ? { gateScore: score.toFixed(2), gatePassedAt: now, completedAt: now, updatedAt: now }
        : { gateScore: score.toFixed(2), updatedAt: now },
    });
}

/** Mark an ungated chapter complete (all core sections drilled). */
export async function markChapterComplete(
  db: Executor,
  userId: string,
  chapterSlug: string,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insert(chapterProgress)
    .values({ userId, chapterSlug, completedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [chapterProgress.userId, chapterProgress.chapterSlug],
      set: { completedAt: now, updatedAt: now },
    });
}

// ─── Topic mastery ────────────────────────────────────────────────────────────

export async function listTopicMastery(
  db: Executor,
  userId: string,
): Promise<TopicMasteryEntry[]> {
  const rows = await db.select().from(topicMastery).where(eq(topicMastery.userId, userId));
  return rows.map((r) => ({ topic: r.topic, score: Number(r.score), attempts: r.attempts }));
}

export async function getTopicMastery(
  db: Executor,
  userId: string,
  topic: string,
): Promise<TopicMasteryEntry | null> {
  const rows = await db
    .select()
    .from(topicMastery)
    .where(and(eq(topicMastery.userId, userId), eq(topicMastery.topic, topic)))
    .limit(1);
  const r = rows[0];
  return r ? { topic: r.topic, score: Number(r.score), attempts: r.attempts } : null;
}

export async function upsertTopicMastery(
  db: Executor,
  userId: string,
  entry: TopicMasteryEntry,
): Promise<void> {
  await db
    .insert(topicMastery)
    .values({
      userId,
      topic: entry.topic,
      score: entry.score.toFixed(3),
      attempts: entry.attempts,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [topicMastery.userId, topicMastery.topic],
      set: {
        score: entry.score.toFixed(3),
        attempts: entry.attempts,
        updatedAt: new Date().toISOString(),
      },
    });
}

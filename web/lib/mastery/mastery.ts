// Mastery model math — pure functions only (no DB, no network).
// Phase 1 uses an exponentially-weighted moving average per topic; the alpha
// floor keeps mastery responsive after many attempts instead of freezing.

import type { TopicMasteryEntry } from "@/lib/types";

const ALPHA_FLOOR = 0.15;

/** Follow-up answers signal deeper mastery than first answers. */
export const ATTEMPT_WEIGHTS = {
  first: 1,
  followup: 1.5,
  gate: 1.25,
} as const;

export type AttemptKind = keyof typeof ATTEMPT_WEIGHTS;

/**
 * Fold one graded attempt (score 0–100) into a topic's mastery.
 * Returns the new entry; score stays in [0, 1].
 */
export function updateMastery(
  prev: TopicMasteryEntry | null,
  topic: string,
  attemptScore: number,
  kind: AttemptKind = "first",
): TopicMasteryEntry {
  const x = Math.max(0, Math.min(1, attemptScore / 100));
  const attempts = (prev?.attempts ?? 0) + 1;
  const alpha = Math.max(ALPHA_FLOOR, 1 / attempts) * ATTEMPT_WEIGHTS[kind];
  const effectiveAlpha = Math.min(1, alpha);
  const prevScore = prev?.score ?? 0;
  const score = prevScore + effectiveAlpha * (x - prevScore);
  return { topic, score: Math.max(0, Math.min(1, score)), attempts };
}

/** Topics sorted weakest-first, ignoring topics with too little signal. */
export function weakestTopics(
  entries: TopicMasteryEntry[],
  count: number,
  minAttempts = 3,
): TopicMasteryEntry[] {
  return entries
    .filter((e) => e.attempts >= minAttempts)
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

// ─── Spaced re-surfacing ──────────────────────────────────────────────────────
// Weak/incorrect questions come back every 2–3 days (per spec) until answered
// correctly twice in a row, then park at a long interval.

export type SpacedInput = {
  intervalDays: number;
  consecutiveCorrect: number;
};

export type SpacedNext = {
  intervalDays: number;
  consecutiveCorrect: number;
  nextDueAt: Date;
};

const MASTERED_INTERVAL_DAYS = 14;

export function nextReview(prev: SpacedInput | null, correct: boolean, now: Date): SpacedNext {
  const consecutive = correct ? (prev?.consecutiveCorrect ?? 0) + 1 : 0;
  let intervalDays: number;
  if (!correct) {
    intervalDays = 2;
  } else if (consecutive >= 2) {
    intervalDays = MASTERED_INTERVAL_DAYS;
  } else {
    intervalDays = 3;
  }
  const nextDueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { intervalDays, consecutiveCorrect: consecutive, nextDueAt };
}

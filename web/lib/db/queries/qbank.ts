import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";

import type { Executor } from "@/lib/db/client";
import { qbankAttempts, qbankFollowups, qbankQuestions, qbankSpacedState } from "@/lib/db/schema";
import type {
  QbankDifficulty,
  QbankFollowup,
  QbankQuestion,
  QbankQuestionType,
  RubricKeyPoint,
} from "@/lib/types";

// ─── Row → domain type mapping ────────────────────────────────────────────────

function mapQuestion(r: typeof qbankQuestions.$inferSelect): QbankQuestion {
  return {
    id: r.id,
    topic: r.topic,
    difficulty: r.difficulty as QbankDifficulty,
    questionType: r.questionType as QbankQuestionType,
    prompt: r.prompt,
    keyPoints: (r.keyPoints as RubricKeyPoint[]) ?? [],
    misconceptions: (r.misconceptions as string[]) ?? [],
    modelAnswer: r.modelAnswer,
    chapterSlug: r.chapterSlug ?? undefined,
    sectionSlug: r.sectionSlug ?? undefined,
    advanced: r.advanced,
  };
}

function mapFollowup(r: typeof qbankFollowups.$inferSelect): QbankFollowup {
  return {
    id: r.id,
    questionId: r.questionId,
    ordinal: r.ordinal,
    prompt: r.prompt,
    modelAnswer: r.modelAnswer,
  };
}

// ─── Question selection ───────────────────────────────────────────────────────

export type PickQuestionOpts = {
  topic?: string;
  difficulty?: QbankDifficulty;
  includeAdvanced?: boolean;
  /** Prefer questions this user hasn't answered correctly yet. */
  userId: string;
};

/** Random question matching the filters, preferring never-correctly-answered ones. */
export async function pickQuestion(
  db: Executor,
  opts: PickQuestionOpts,
): Promise<QbankQuestion | null> {
  const filters = [eq(qbankQuestions.active, true)];
  if (opts.topic) filters.push(eq(qbankQuestions.topic, opts.topic));
  if (opts.difficulty) filters.push(eq(qbankQuestions.difficulty, opts.difficulty));
  if (!opts.includeAdvanced) filters.push(eq(qbankQuestions.advanced, false));

  const notMastered = sql`not exists (
    select 1 from ${qbankAttempts}
    where ${qbankAttempts.questionId} = ${qbankQuestions.id}
      and ${qbankAttempts.userId} = ${opts.userId}
      and ${qbankAttempts.correct} = true
  )`;

  const fresh = await db
    .select()
    .from(qbankQuestions)
    .where(and(...filters, notMastered))
    .orderBy(sql`random()`)
    .limit(1);
  if (fresh[0]) return mapQuestion(fresh[0]);

  // Everything answered correctly — serve any matching question.
  const any = await db
    .select()
    .from(qbankQuestions)
    .where(and(...filters))
    .orderBy(sql`random()`)
    .limit(1);
  return any[0] ? mapQuestion(any[0]) : null;
}

export async function getQuestionById(db: Executor, id: string): Promise<QbankQuestion | null> {
  const rows = await db.select().from(qbankQuestions).where(eq(qbankQuestions.id, id)).limit(1);
  return rows[0] ? mapQuestion(rows[0]) : null;
}

export async function getFollowups(db: Executor, questionId: string): Promise<QbankFollowup[]> {
  const rows = await db
    .select()
    .from(qbankFollowups)
    .where(eq(qbankFollowups.questionId, questionId))
    .orderBy(asc(qbankFollowups.ordinal));
  return rows.map(mapFollowup);
}

export async function getFollowupById(db: Executor, id: string): Promise<QbankFollowup | null> {
  const rows = await db.select().from(qbankFollowups).where(eq(qbankFollowups.id, id)).limit(1);
  return rows[0] ? mapFollowup(rows[0]) : null;
}

/** Random questions for a section drill. */
export async function getSectionDrillQuestions(
  db: Executor,
  chapterSlug: string,
  sectionSlug: string,
  limit: number,
): Promise<QbankQuestion[]> {
  const rows = await db
    .select()
    .from(qbankQuestions)
    .where(
      and(
        eq(qbankQuestions.active, true),
        eq(qbankQuestions.chapterSlug, chapterSlug),
        eq(qbankQuestions.sectionSlug, sectionSlug),
      ),
    )
    .orderBy(sql`random()`)
    .limit(limit);
  return rows.map(mapQuestion);
}

/**
 * Count of active, non-advanced questions available for a chapter's gate
 * quiz. Lets `finishSittingAction` bound the expected sitting size to what
 * the pool can actually serve, rather than a flat constant that could exceed
 * a thin chapter's question count and lock out legitimate sittings.
 */
export async function countGateQuestions(db: Executor, chapterSlug: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(qbankQuestions)
    .where(
      and(
        eq(qbankQuestions.active, true),
        eq(qbankQuestions.chapterSlug, chapterSlug),
        eq(qbankQuestions.advanced, false),
      ),
    );
  return rows[0]?.n ?? 0;
}

/** Count of active questions available for a section drill — see countGateQuestions. */
export async function countSectionDrillQuestions(
  db: Executor,
  chapterSlug: string,
  sectionSlug: string,
): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(qbankQuestions)
    .where(
      and(
        eq(qbankQuestions.active, true),
        eq(qbankQuestions.chapterSlug, chapterSlug),
        eq(qbankQuestions.sectionSlug, sectionSlug),
      ),
    );
  return rows[0]?.n ?? 0;
}

/** Mixed non-advanced questions across a chapter — the gate quiz. */
export async function getGateQuestions(
  db: Executor,
  chapterSlug: string,
  limit: number,
): Promise<QbankQuestion[]> {
  const rows = await db
    .select()
    .from(qbankQuestions)
    .where(
      and(
        eq(qbankQuestions.active, true),
        eq(qbankQuestions.chapterSlug, chapterSlug),
        eq(qbankQuestions.advanced, false),
      ),
    )
    .orderBy(sql`random()`)
    .limit(limit);
  return rows.map(mapQuestion);
}

/** Interleaved daily-drill pool: random non-advanced questions across the given topics. */
export async function getInterleavedQuestions(
  db: Executor,
  topics: string[],
  limit: number,
): Promise<QbankQuestion[]> {
  if (topics.length === 0) return [];
  const rows = await db
    .select()
    .from(qbankQuestions)
    .where(
      and(
        eq(qbankQuestions.active, true),
        eq(qbankQuestions.advanced, false),
        inArray(qbankQuestions.topic, topics),
      ),
    )
    .orderBy(sql`random()`)
    .limit(limit);
  return rows.map(mapQuestion);
}

// ─── Attempts + spaced review ─────────────────────────────────────────────────

export type RecordAttemptInput = {
  userId: string;
  questionId: string;
  followupId?: string;
  answer: string;
  score: number;
  correct: boolean;
  rubricBreakdown: unknown;
  context: "qbank" | "section-drill" | "chapter-gate" | "daily-drill";
};

export async function recordAttempt(db: Executor, input: RecordAttemptInput): Promise<void> {
  await db.insert(qbankAttempts).values({
    userId: input.userId,
    questionId: input.questionId,
    followupId: input.followupId ?? null,
    answer: input.answer,
    score: input.score.toFixed(2),
    correct: input.correct,
    rubricBreakdown: input.rubricBreakdown,
    context: input.context,
  });
}

export type SpacedStateRow = {
  questionId: string;
  nextDueAt: string;
  intervalDays: number;
  consecutiveCorrect: number;
};

export async function getSpacedState(
  db: Executor,
  userId: string,
  questionId: string,
): Promise<SpacedStateRow | null> {
  const rows = await db
    .select()
    .from(qbankSpacedState)
    .where(and(eq(qbankSpacedState.userId, userId), eq(qbankSpacedState.questionId, questionId)))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    questionId: r.questionId,
    nextDueAt: r.nextDueAt,
    intervalDays: r.intervalDays,
    consecutiveCorrect: r.consecutiveCorrect,
  };
}

export async function upsertSpacedState(
  db: Executor,
  userId: string,
  state: SpacedStateRow,
): Promise<void> {
  await db
    .insert(qbankSpacedState)
    .values({
      userId,
      questionId: state.questionId,
      nextDueAt: state.nextDueAt,
      intervalDays: state.intervalDays,
      consecutiveCorrect: state.consecutiveCorrect,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [qbankSpacedState.userId, qbankSpacedState.questionId],
      set: {
        nextDueAt: state.nextDueAt,
        intervalDays: state.intervalDays,
        consecutiveCorrect: state.consecutiveCorrect,
        updatedAt: new Date().toISOString(),
      },
    });
}

/** Questions due for spaced review, oldest due first. */
export async function listDueReviews(
  db: Executor,
  userId: string,
  limit: number,
): Promise<QbankQuestion[]> {
  const rows = await db
    .select({ question: qbankQuestions })
    .from(qbankSpacedState)
    .innerJoin(qbankQuestions, eq(qbankQuestions.id, qbankSpacedState.questionId))
    .where(
      and(
        eq(qbankSpacedState.userId, userId),
        lte(qbankSpacedState.nextDueAt, new Date().toISOString()),
      ),
    )
    .orderBy(asc(qbankSpacedState.nextDueAt))
    .limit(limit);
  return rows.map((r) => mapQuestion(r.question));
}

export async function countDueReviews(db: Executor, userId: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(qbankSpacedState)
    .where(
      and(
        eq(qbankSpacedState.userId, userId),
        lte(qbankSpacedState.nextDueAt, new Date().toISOString()),
      ),
    );
  return rows[0]?.n ?? 0;
}

export type AttemptSummary = {
  questionId: string;
  score: number;
  correct: boolean;
  answeredAt: string;
};

/**
 * Scores from a just-finished quiz sitting: latest attempt per question for
 * this user/context/chapter since `sinceIso`. Used to recompute gate and
 * section-drill results server-side instead of trusting client-sent scores.
 *
 * Already deduped to one row per `questionId` (latest attempt wins), so
 * callers can treat `result.length` as both the attempt count and the
 * distinct-question count — grading the same question repeatedly can't pad
 * the count toward a gate's expected sitting size.
 */
export async function listSittingScores(
  db: Executor,
  opts: {
    userId: string;
    context: "section-drill" | "chapter-gate";
    chapterSlug: string;
    sectionSlug?: string;
    sinceIso: string;
  },
): Promise<{ questionId: string; score: number; answeredAt: string }[]> {
  const filters = [
    eq(qbankAttempts.userId, opts.userId),
    eq(qbankAttempts.context, opts.context),
    eq(qbankQuestions.chapterSlug, opts.chapterSlug),
    sql`${qbankAttempts.answeredAt} >= ${opts.sinceIso}`,
  ];
  if (opts.sectionSlug) filters.push(eq(qbankQuestions.sectionSlug, opts.sectionSlug));

  const rows = await db
    .select({
      questionId: qbankAttempts.questionId,
      score: qbankAttempts.score,
      answeredAt: qbankAttempts.answeredAt,
    })
    .from(qbankAttempts)
    .innerJoin(qbankQuestions, eq(qbankQuestions.id, qbankAttempts.questionId))
    .where(and(...filters))
    .orderBy(desc(qbankAttempts.answeredAt));

  // Latest attempt per question wins.
  const latest = new Map<string, { questionId: string; score: number; answeredAt: string }>();
  for (const r of rows) {
    if (!latest.has(r.questionId)) {
      latest.set(r.questionId, {
        questionId: r.questionId,
        score: Number(r.score),
        answeredAt: r.answeredAt,
      });
    }
  }
  return [...latest.values()];
}

export async function listRecentAttempts(
  db: Executor,
  userId: string,
  limit: number,
): Promise<AttemptSummary[]> {
  const rows = await db
    .select()
    .from(qbankAttempts)
    .where(eq(qbankAttempts.userId, userId))
    .orderBy(desc(qbankAttempts.answeredAt))
    .limit(limit);
  return rows.map((r) => ({
    questionId: r.questionId,
    score: Number(r.score),
    correct: r.correct,
    answeredAt: r.answeredAt,
  }));
}

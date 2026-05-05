import { z } from "zod";

export const INTERVIEW_MODES = ["technical", "behavioral", "firm", "superday", "markets"] as const;

const AudioMetricsSchema = z
  .object({
    wpm: z.number().finite().nonnegative().max(1000),
    fillerCount: z.number().int().nonnegative().max(10000),
    pauseRatio: z.number().finite().min(0).max(1),
    longestPauseMs: z
      .number()
      .finite()
      .nonnegative()
      .max(10 * 60_000),
    totalSpeakingMs: z
      .number()
      .finite()
      .nonnegative()
      .max(60 * 60_000),
  })
  .strict();

export const InterviewScoreSchema = z
  .object({
    question: z.string().trim().min(1).max(1500),
    mode: z.enum(INTERVIEW_MODES),
    transcript: z.string().trim().min(1).max(15000),
    audioMetrics: AudioMetricsSchema,
    idealAnswerOutline: z.string().trim().max(4000).optional().default(""),
  })
  .strict();
export type InterviewScoreInput = z.infer<typeof InterviewScoreSchema>;

const RubricItemSchema = z
  .object({
    dimension: z.string().trim().min(1).max(120),
    score: z.number().int().min(0).max(100),
    comment: z.string().trim().max(600),
  })
  .strict();

const ScorecardSchema = z
  .object({
    content_score: z.number().int().min(0).max(100),
    delivery_score: z.number().int().min(0).max(100),
    rubric: z.array(RubricItemSchema).max(10),
    strengths: z.array(z.string().trim().max(600)).max(10),
    improvements: z.array(z.string().trim().max(600)).max(10),
    follow_up_questions: z.array(z.string().trim().max(600)).max(10),
    model_answer: z.string().trim().max(4000),
  })
  .strict();

export const InterviewSaveSchema = z
  .object({
    questionText: z.string().trim().min(1).max(1500),
    mode: z.enum(INTERVIEW_MODES),
    transcript: z.string().trim().max(15000).optional(),
    scorecard: ScorecardSchema.optional(),
    audioMetrics: AudioMetricsSchema.optional(),
    durationSeconds: z
      .number()
      .finite()
      .nonnegative()
      .max(60 * 60)
      .optional(),
  })
  .strict();
export type InterviewSaveInput = z.infer<typeof InterviewSaveSchema>;

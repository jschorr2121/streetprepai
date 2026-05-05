import { z } from "zod";

// Mirrors AppliedJobStage in lib/types.ts exactly.
export const APPLIED_JOB_STAGES = [
  "shortlist",
  "applied",
  "interview",
  "superday",
  "offer",
  "rejected",
] as const;

export const AppliedJobInputSchema = z.object({
  firm: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  group: z.string().trim().max(120).optional(),
  deadline: z.string().trim().max(40).optional(),
  url: z.string().trim().url().max(2048).optional(),
  stage: z.enum(APPLIED_JOB_STAGES),
  notes: z.string().trim().max(2000).optional(),
});
export type AppliedJobInput = z.infer<typeof AppliedJobInputSchema>;

export const AppliedJobPatchSchema = AppliedJobInputSchema.partial();
export type AppliedJobPatch = z.infer<typeof AppliedJobPatchSchema>;

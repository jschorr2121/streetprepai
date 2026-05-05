import { z } from "zod";

export const ResumeCritiqueSchema = z
  .object({
    rawText: z.string().trim().min(1).max(25000),
  })
  .strict();
export type ResumeCritiqueInput = z.infer<typeof ResumeCritiqueSchema>;

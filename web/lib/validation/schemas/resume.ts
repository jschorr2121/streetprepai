import { z } from "zod";

export const ResumeCritiqueSchema = z
  .object({
    rawText: z.string().trim().min(1).max(25000),
  })
  .strict();
export type ResumeCritiqueInput = z.infer<typeof ResumeCritiqueSchema>;

/** LLM tool output for resume/critique's `critique_resume` tool — validated
 * before it is returned to the client (model output is untrusted). Weakness
 * flags stay plain strings so an off-vocabulary tag degrades gracefully
 * instead of failing the whole critique. */
export const ResumeCritiqueOutputSchema = z.object({
  sections: z
    .array(
      z.object({
        heading: z.string().max(500),
        bullets: z
          .array(
            z.object({
              id: z.string().max(200),
              original: z.string().max(4000),
              rewritten: z.string().max(4000),
              weakness_flags: z.array(z.string().max(100)).max(20),
              critique: z.string().max(1000),
              confidence: z.enum(["high", "medium", "low"]),
            }),
          )
          .max(200),
      }),
    )
    .max(50),
  summary: z.object({
    total_bullets: z.number().int().min(0),
    weak_bullets: z.number().int().min(0),
    top_issues: z.array(z.string().max(500)).max(10),
  }),
});
export type ResumeCritiqueOutput = z.infer<typeof ResumeCritiqueOutputSchema>;

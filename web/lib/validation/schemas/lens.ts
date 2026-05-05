import { z } from "zod";

export const LensExplainSchema = z
  .object({
    guideTitle: z.string().trim().min(1).max(300),
    sectionHeading: z.string().trim().max(300).optional(),
    selection: z.string().trim().min(1).max(4000),
    surroundingContext: z.string().trim().max(12000).optional(),
    question: z.string().trim().max(1000).optional(),
  })
  .strict();
export type LensExplainInput = z.infer<typeof LensExplainSchema>;

export const LensBeginnerSchema = z
  .object({
    guideTitle: z.string().trim().min(1).max(300),
    sectionHeading: z.string().trim().min(1).max(300),
    sectionContent: z.string().trim().min(1).max(12000),
  })
  .strict();
export type LensBeginnerInput = z.infer<typeof LensBeginnerSchema>;

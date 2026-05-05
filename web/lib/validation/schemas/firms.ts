import { z } from "zod";

/**
 * URL slug shape for firm route params. Matches lowercase letters, digits,
 * and hyphens. Used by `firms/[slug]/prep`.
 */
export const FirmSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid slug");
export type FirmSlug = z.infer<typeof FirmSlugSchema>;

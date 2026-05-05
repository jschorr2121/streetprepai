import { z } from "zod";

const ExperienceSchema = z
  .object({
    company: z.string().trim().max(200),
    role: z.string().trim().max(200),
    startDate: z.string().trim().max(40).optional(),
    endDate: z.string().trim().max(40).optional(),
    location: z.string().trim().max(200).optional(),
    bullets: z.array(z.string().trim().max(2_000)).max(50),
  })
  .strict();

const EducationSchema = z
  .object({
    school: z.string().trim().max(200),
    degree: z.string().trim().max(200).optional(),
    field: z.string().trim().max(200).optional(),
    graduationYear: z.number().int().min(1900).max(2100).optional(),
    gpa: z.number().min(0).max(10).optional(),
  })
  .strict();

/**
 * profile/save — accepts a partial patch of the user's profile.
 * Mirrors `Partial<Omit<Profile, "userId" | "updatedAt">>` from lib/types.
 */
export const ProfileSaveSchema = z
  .object({
    fullName: z.string().trim().max(200).optional(),
    school: z.string().trim().max(200).optional(),
    graduationYear: z.number().int().min(1900).max(2100).optional(),
    targetRoles: z.array(z.string().trim().max(200)).max(50).optional(),
    targetFirms: z.array(z.string().trim().max(200)).max(100).optional(),
    bioSummary: z.string().trim().max(12_000).optional(),
    resumeRawText: z.string().trim().max(30_000).optional(),
    experiences: z.array(ExperienceSchema).max(50).optional(),
    education: z.array(EducationSchema).max(20).optional(),
    skills: z.array(z.string().trim().max(120)).max(100).optional(),
  })
  .strict();
export type ProfileSaveInput = z.infer<typeof ProfileSaveSchema>;

/** profile/extract-resume — runs OpenAI structured extraction on raw resume text. */
export const ExtractResumeSchema = z
  .object({
    rawText: z.string().trim().min(1).max(30_000),
  })
  .strict();
export type ExtractResumeInput = z.infer<typeof ExtractResumeSchema>;

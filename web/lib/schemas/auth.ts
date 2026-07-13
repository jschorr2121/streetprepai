import { z } from "zod";

// Shared auth + onboarding Zod schemas. Server Actions parse these on the server
// and client forms reuse them via the react-hook-form zodResolver (single source
// of truth, per code-standards).

// Supabase's default minimum password length is 6. We require 8 here as a
// slightly stronger floor; Supabase still enforces its own minimum server-side.
const MIN_PASSWORD_LENGTH = 8;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email");

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// --- Onboarding ---

export const SEMESTERS = [
  "Freshman Fall",
  "Freshman Spring",
  "Sophomore Fall",
  "Sophomore Spring",
  "Junior Fall",
  "Junior Spring",
  "Senior Fall",
  "Senior Spring",
] as const;

export type Semester = (typeof SEMESTERS)[number];

const CURRENT_YEAR = new Date().getUTCFullYear();
const MIN_GRAD_YEAR = CURRENT_YEAR - 1;
const MAX_GRAD_YEAR = CURRENT_YEAR + 6;

export const onboardingSchema = z.object({
  school: z.string().trim().min(1, "School is required").max(200),
  graduationYear: z
    .number({ message: "Graduation year is required" })
    .int("Enter a valid year")
    .min(MIN_GRAD_YEAR, `Year must be ${MIN_GRAD_YEAR} or later`)
    .max(MAX_GRAD_YEAR, `Year must be ${MAX_GRAD_YEAR} or earlier`),
  currentSemester: z.enum(SEMESTERS, { message: "Select your current semester" }),
  targetFirms: z.array(z.string().trim().min(1)).min(1, "Add at least one target firm"),
  // Advanced track surfaces ⭐ elective sections + advanced questions. Off by
  // default — most undergrads target IB, not PE/experienced-hire depth.
  advancedTrack: z.boolean(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const GRAD_YEAR_RANGE = { min: MIN_GRAD_YEAR, max: MAX_GRAD_YEAR } as const;

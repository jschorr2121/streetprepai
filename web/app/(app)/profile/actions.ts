"use server";

/**
 * This file is the canonical example of a Server Action that follows
 * code-standards.md §Next.js → 7-step skeleton. Every future Server Action
 * migration unit should copy this pattern verbatim and substitute domain logic.
 *
 * Pattern summary (7 steps):
 *  1. requireUser()          — auth gate; returns user or throws UnauthorizedError.
 *  2. Zod safeParse(input)   — colocated schema; returns VALIDATION_FAILED with fieldErrors.
 *  3. Rate-limit check       — Upstash limiter keyed by userId; returns RATE_LIMITED.
 *  4. Ownership check        — confirm userId matches the resource (RLS is safety net only).
 *  5. The work in try/catch  — Drizzle write via withUser (RLS-scoped transaction).
 *  6. logger.info on success; Sentry capture on unexpected error.
 *  7. Return ActionResult<T> — { ok: true, data } | { ok: false, error }.
 */

import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import {
  actionErrorFromAppError,
  fieldErrorsFromIssues,
  type ActionResult,
} from "@/lib/auth/action-result";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { updateProfile } from "@/lib/db/queries/profile";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { profileMutationLimiter } from "@/lib/ratelimit/limiters";
import type { Profile } from "@/lib/types";

// ─── Colocated Zod schema ─────────────────────────────────────────────────────
// Mirrors `ProfileSaveSchema` from lib/validation/schemas/profile.ts. The
// client form imports this directly (single source of truth for validation).

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

export const saveProfileSchema = z
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

export type SaveProfileInput = z.infer<typeof saveProfileSchema>;

// ─── Server Action ────────────────────────────────────────────────────────────

export async function saveProfileAction(input: unknown): Promise<ActionResult<Profile>> {
  // Step 1 — Auth.
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof AppError) return actionErrorFromAppError(err);
    throw err;
  }

  // Step 2 — Validate.
  const parsed = saveProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Check the highlighted fields.",
        fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
      },
    };
  }

  // Step 3 — Rate limit (keyed by userId; Upstash sliding window).
  const rl = await profileMutationLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Slow down a bit and try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Step 4 — Ownership. The profile row is always the caller's own (userId is
  // sourced from requireUser(), not from the input). RLS via `withUser` is the
  // safety net; this step is satisfied structurally.

  // Step 5 — Work (Drizzle write via withUser → RLS-scoped transaction).
  let profile: Profile;
  try {
    profile = await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      updateProfile(tx, userId, parsed.data),
    );
  } catch (err) {
    logger.error({ userId, action: "profile_save_failed" }, "profile_save_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  // Step 6 — Log success.
  logger.info({ userId, action: "profile_saved" }, "profile_saved");

  // Step 7 — Return.
  return { ok: true, data: profile };
}

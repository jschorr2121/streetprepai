"use server";

/**
 * Server Actions for the Application Tracker (Unit 7).
 *
 * Pattern: 7-step skeleton from code-standards.md §Next.js, mirroring
 * `app/(app)/profile/actions.ts` (Unit 6 canonical reference).
 *
 * Ownership check (step 4) is real here — unlike the profile action where the
 * resource is always the caller's own, update/delete must fetch the target row
 * and confirm user_id === caller.id before proceeding.
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
import { AppError } from "@/lib/errors";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  updateApplication,
} from "@/lib/db/queries/applications";
import { logger } from "@/lib/logging/logger";
import { applicationsLimiter } from "@/lib/ratelimit/limiters";
import type { AppliedJob } from "@/lib/types";
import { APPLIED_JOB_STAGES, NOTES_MAX_LENGTH } from "@/lib/validation/schemas/applied-jobs";

// ─── Colocated Zod schemas ────────────────────────────────────────────────────
// Client components import these for RHF resolver validation (single source of truth).

// `new Date("2026-02-31")` rolls over to March 3 instead of failing, so the
// shape regex alone would admit impossible calendar dates that Postgres's
// `date` column then rejects with a raw driver error. Round-trip the parts.
function isRealCalendarDate(value: string): boolean {
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export const createApplicationSchema = z.object({
  firm: z.string().trim().min(1, "Firm is required.").max(200),
  role: z.string().trim().min(1, "Role is required.").max(200),
  group: z.string().trim().max(120).optional(),
  stage: z.enum(APPLIED_JOB_STAGES),
  url: z.string().trim().url("Must be a valid URL.").max(2048).optional().or(z.literal("")),
  // <input type="date"> sends yyyy-mm-dd (or "" when cleared). Enforce that
  // shape here so a malformed value never reaches the Postgres `date` column
  // (which rejects "" and other non-ISO strings with a raw driver error).
  deadline: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must be a valid date.")
    .max(40)
    .refine(isRealCalendarDate, "Deadline must be a valid date.")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX_LENGTH, "Notes must be 5 000 characters or fewer.")
    .optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = createApplicationSchema.partial();
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

const deleteApplicationSchema = z.object({
  id: z.string().uuid("Invalid application ID."),
});

const updateWithIdSchema = updateApplicationSchema.extend({
  id: z.string().uuid("Invalid application ID."),
});

// ─── createApplicationAction ──────────────────────────────────────────────────

export async function createApplicationAction(input: unknown): Promise<ActionResult<AppliedJob>> {
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
  const parsed = createApplicationSchema.safeParse(input);
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

  // Step 3 — Rate limit.
  const rl = await applicationsLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests — try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Step 4 — Ownership. Creating a new row — the userId comes from requireUser()
  // and is passed directly; no external resource to check ownership of.

  // Step 5 — Work.
  let application: AppliedJob;
  try {
    // Normalise empty-string url/deadline to undefined so the DB stores NULL.
    const data = {
      ...parsed.data,
      url: parsed.data.url === "" ? undefined : parsed.data.url,
      deadline: parsed.data.deadline === "" ? undefined : parsed.data.deadline,
    };
    application = await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      createApplication(tx, userId, data),
    );
  } catch (err) {
    logger.error({ userId, action: "application_create_failed" }, "application_create_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  // Step 6 — Log success.
  logger.info(
    { userId, action: "application_created", applicationId: application.id },
    "application_created",
  );

  // Step 7 — Return.
  return { ok: true, data: application };
}

// ─── updateApplicationAction ──────────────────────────────────────────────────

export async function updateApplicationAction(input: unknown): Promise<ActionResult<AppliedJob>> {
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
  const parsed = updateWithIdSchema.safeParse(input);
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

  // Step 3 — Rate limit.
  const rl = await applicationsLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests — try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Step 4 — Ownership check (explicit — RLS is the safety net, not the only check).
  let existing: AppliedJob | null;
  try {
    existing = await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      getApplicationById(tx, parsed.data.id, userId),
    );
  } catch (err) {
    logger.error(
      { userId, action: "application_update_ownership_check_failed" },
      "ownership check error",
    );
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  if (!existing) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Application not found." },
    };
  }

  // Step 5 — Work.
  let application: AppliedJob;
  try {
    const { id, ...fields } = parsed.data;
    // Clear-vs-absent semantics: a field absent from the payload is left
    // untouched (`undefined`, skipped by the query layer's `!== undefined`
    // guard); a field explicitly sent as "" clears the column (`null`). Only
    // url/deadline support clearing today — see UpdateApplicationInput.
    const data = {
      ...fields,
      ...("url" in fields ? { url: fields.url === "" ? null : fields.url } : {}),
      ...("deadline" in fields
        ? { deadline: fields.deadline === "" ? null : fields.deadline }
        : {}),
    };
    application = await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      updateApplication(tx, id, data),
    );
  } catch (err) {
    if (err instanceof AppError) return actionErrorFromAppError(err);
    logger.error({ userId, action: "application_update_failed" }, "application_update_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  // Step 6 — Log success.
  logger.info(
    { userId, action: "application_updated", applicationId: application.id },
    "application_updated",
  );

  // Step 7 — Return.
  return { ok: true, data: application };
}

// ─── deleteApplicationAction ──────────────────────────────────────────────────

export async function deleteApplicationAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
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
  const parsed = deleteApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid request.",
        fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
      },
    };
  }

  // Step 3 — Rate limit.
  const rl = await applicationsLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests — try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Step 4 — Ownership check.
  let existing: AppliedJob | null;
  try {
    existing = await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      getApplicationById(tx, parsed.data.id, userId),
    );
  } catch (err) {
    logger.error(
      { userId, action: "application_delete_ownership_check_failed" },
      "ownership check error",
    );
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  if (!existing) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Application not found." },
    };
  }

  // Step 5 — Work.
  try {
    await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      deleteApplication(tx, parsed.data.id),
    );
  } catch (err) {
    if (err instanceof AppError) return actionErrorFromAppError(err);
    logger.error({ userId, action: "application_delete_failed" }, "application_delete_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  // Step 6 — Log success.
  logger.info(
    { userId, action: "application_deleted", applicationId: parsed.data.id },
    "application_deleted",
  );

  // Step 7 — Return.
  return { ok: true, data: { id: parsed.data.id } };
}

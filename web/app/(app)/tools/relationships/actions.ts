"use server";

/**
 * Server Actions for the Relationship Manager contact CRUD.
 *
 * Pattern: 7-step skeleton from code-standards.md §Next.js, mirroring
 * `app/(app)/tools/applications/actions.ts`. Data access stays in
 * `lib/data/contacts.ts` (Supabase session client) to match the existing
 * relationship reads used by the pages and chatbot tools.
 */

import * as Sentry from "@sentry/nextjs";

import { actionErrorFromAppError, fieldErrorsFromIssues, type ActionResult } from "@/lib/auth/action-result";
import { requireUser } from "@/lib/auth/server";
import { createContact, updateContactStage } from "@/lib/data/contacts";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { contactsLimiter } from "@/lib/ratelimit/limiters";
import type { Contact } from "@/lib/types";
import {
  CreateContactSchema,
  UpdateContactStageSchema,
} from "@/lib/validation/schemas/relationships";

// ─── createContactAction ─────────────────────────────────────────────────────

export async function createContactAction(input: unknown): Promise<ActionResult<Contact>> {
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
  const parsed = CreateContactSchema.safeParse(input);
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
  const rl = await contactsLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests — try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Step 4 — Ownership: creating a new row owned by the caller; nothing to check.

  // Step 5 — Work.
  let contact: Contact;
  try {
    const { gradYear, ...rest } = parsed.data;
    contact = await createContact(userId, {
      ...rest,
      ...(gradYear ? { gradYear: Number(gradYear) } : {}),
    });
  } catch (err) {
    logger.error({ userId, action: "contact_create_failed" }, "contact_create_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  // Step 6 — Log success.
  logger.info({ userId, action: "contact_created", contactId: contact.id }, "contact_created");

  // Step 7 — Return.
  return { ok: true, data: contact };
}

// ─── updateContactStageAction ────────────────────────────────────────────────

export async function updateContactStageAction(input: unknown): Promise<ActionResult<Contact>> {
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
  const parsed = UpdateContactStageSchema.safeParse(input);
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
  const rl = await contactsLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests — try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Steps 4+5 — Ownership + work in one round trip: the UPDATE is scoped by
  // user_id (and RLS underneath), so a null result means not-found-or-not-yours.
  let contact: Contact | null;
  try {
    contact = await updateContactStage(userId, parsed.data.id, parsed.data.stage);
  } catch (err) {
    logger.error({ userId, action: "contact_stage_update_failed" }, "contact_stage_update_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  if (!contact) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Contact not found." } };
  }

  // Step 6 — Log success.
  logger.info(
    { userId, action: "contact_stage_updated", contactId: contact.id, stage: contact.stage },
    "contact_stage_updated",
  );

  // Step 7 — Return.
  return { ok: true, data: contact };
}

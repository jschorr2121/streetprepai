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

import {
  actionErrorFromAppError,
  fieldErrorsFromIssues,
  type ActionResult,
} from "@/lib/auth/action-result";
import { requireUser } from "@/lib/auth/server";
import {
  createContact,
  getContactById,
  saveChatFollowUpDraft,
  saveChatStructured,
  touchContactLastContact,
  updateContactStage,
  upsertChatLog,
} from "@/lib/data/contacts";
import {
  completeFollowup,
  createFollowup,
  followupDueDate,
  getFollowups,
} from "@/lib/data/followups";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { contactsLimiter } from "@/lib/ratelimit/limiters";
import type { Contact, ChatLog } from "@/lib/types";
import {
  CompleteFollowupSchema,
  CreateContactSchema,
  LogChatSchema,
  SaveChatSummarySchema,
  SaveFollowUpDraftSchema,
  UpdateContactStageSchema,
  type ChatSummaryOutput,
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

// ─── logChatAction ───────────────────────────────────────────────────────────

export async function logChatAction(input: unknown): Promise<ActionResult<ChatLog>> {
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
  const parsed = LogChatSchema.safeParse(input);
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

  // Step 4 — Ownership: the chat must hang off a contact the caller owns.
  let contact: Contact | null;
  try {
    contact = await getContactById(parsed.data.contactId, userId);
  } catch (err) {
    logger.error({ userId, action: "chat_log_ownership_check_failed" }, "ownership check error");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
  if (!contact) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Contact not found." } };
  }

  // Step 5 — Work.
  let chat: ChatLog | null;
  try {
    chat = await upsertChatLog(userId, parsed.data);
    if (chat) {
      // Best-effort: the chat is already saved; a failed date stamp only
      // affects the "gentle nudges" widget, so log instead of failing.
      await touchContactLastContact(userId, contact.id).catch((err: unknown) => {
        logger.warn(
          { userId, action: "contact_touch_failed", contactId: contact.id },
          "contact_touch_failed",
        );
        Sentry.captureException(err);
      });
    }
  } catch (err) {
    logger.error({ userId, action: "chat_log_failed" }, "chat_log_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
  if (!chat) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Chat log not found." } };
  }

  // Step 6 — Log success.
  logger.info(
    { userId, action: "chat_logged", chatId: chat.id, contactId: contact.id },
    "chat_logged",
  );

  // Step 7 — Return.
  return { ok: true, data: chat };
}

// ─── saveChatSummaryAction ───────────────────────────────────────────────────

export async function saveChatSummaryAction(input: unknown): Promise<ActionResult<ChatLog>> {
  // Step 1 — Auth.
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof AppError) return actionErrorFromAppError(err);
    throw err;
  }

  // Step 2 — Validate (structured is model output — parse before persisting).
  const parsed = SaveChatSummarySchema.safeParse(input);
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

  // Steps 4+5 — Ownership + work in one round trip (UPDATE scoped by user_id).
  let chat: ChatLog | null;
  try {
    chat = await saveChatStructured(userId, parsed.data.chatId, parsed.data.structured);
  } catch (err) {
    logger.error({ userId, action: "chat_summary_save_failed" }, "chat_summary_save_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
  if (!chat) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Chat log not found." } };
  }

  // Best-effort: turn the summary's action items into followup rows (the
  // "Upcoming follow-ups" widget reads these). The summary itself is already
  // saved, so a failure here is logged rather than surfaced.
  try {
    await createFollowupsFromSummary(userId, chat.contactId, parsed.data.structured);
  } catch (err) {
    logger.warn(
      { userId, action: "chat_followups_create_failed", chatId: chat.id },
      "chat_followups_create_failed",
    );
    Sentry.captureException(err);
  }

  // Step 6 — Log success.
  logger.info({ userId, action: "chat_summary_saved", chatId: chat.id }, "chat_summary_saved");

  // Step 7 — Return.
  return { ok: true, data: chat };
}

// ─── saveFollowUpDraftAction ─────────────────────────────────────────────────

export async function saveFollowUpDraftAction(input: unknown): Promise<ActionResult<ChatLog>> {
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
  const parsed = SaveFollowUpDraftSchema.safeParse(input);
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

  // Steps 4+5 — Ownership + work in one round trip (UPDATE scoped by user_id).
  let chat: ChatLog | null;
  try {
    chat = await saveChatFollowUpDraft(userId, parsed.data.chatId, parsed.data.draft);
  } catch (err) {
    logger.error({ userId, action: "followup_draft_save_failed" }, "followup_draft_save_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
  if (!chat) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Chat log not found." } };
  }

  // Step 6 — Log success.
  logger.info({ userId, action: "followup_draft_saved", chatId: chat.id }, "followup_draft_saved");

  // Step 7 — Return.
  return { ok: true, data: chat };
}

// ─── completeFollowupAction ──────────────────────────────────────────────────

export async function completeFollowupAction(
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
  const parsed = CompleteFollowupSchema.safeParse(input);
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

  // Steps 4+5 — Ownership + work in one round trip (UPDATE scoped by user_id).
  let done: boolean;
  try {
    done = await completeFollowup(userId, parsed.data.id);
  } catch (err) {
    logger.error({ userId, action: "followup_complete_failed" }, "followup_complete_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
  if (!done) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Follow-up not found." } };
  }

  // Step 6 — Log success.
  logger.info(
    { userId, action: "followup_completed", followupId: parsed.data.id },
    "followup_completed",
  );

  // Step 7 — Return.
  return { ok: true, data: { id: parsed.data.id } };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Creates followup rows from a chat summary's action items, deduping against
 * the contact's open followups so re-structuring a sitting doesn't duplicate. */
async function createFollowupsFromSummary(
  userId: string,
  contactId: string,
  structured: ChatSummaryOutput,
): Promise<void> {
  const items = structured.followUps
    .map((f) => ({ note: f.description.trim().slice(0, 500), dueAt: followupDueDate(f.dueBy) }))
    .filter((f) => f.note.length > 0)
    .slice(0, 10);
  if (items.length === 0) return;

  const open = await getFollowups(userId);
  const openNotes = new Set(open.filter((f) => f.contactId === contactId).map((f) => f.note));
  for (const item of items) {
    if (openNotes.has(item.note)) continue;
    await createFollowup(userId, {
      contactId,
      dueAt: item.dueAt,
      kind: "post-chat",
      note: item.note,
    });
  }
}

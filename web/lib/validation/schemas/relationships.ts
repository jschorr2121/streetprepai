import { z } from "zod";

/** prep-person — generates an AI prep sheet from a contact's bio.
 *
 * `contactId` is optional; when supplied the route enriches the prompt with
 * top-k semantically-similar past chats for this user+contact via pgvector.
 * Omit it for the legacy "no recall" behaviour.
 */
export const PrepPersonSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    firm: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(200),
    group: z.string().trim().max(200).optional(),
    school: z.string().trim().max(200).optional(),
    bio: z.string().trim().max(12_000).optional(),
    studentContext: z.string().trim().max(4_000).optional(),
    contactId: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
export type PrepPersonInput = z.infer<typeof PrepPersonSchema>;

/** draft-outreach — drafts a cold outreach email via Claude tool use. */
export const DraftOutreachSchema = z
  .object({
    contactName: z.string().trim().min(1).max(200),
    contactFirm: z.string().trim().min(1).max(200),
    contactTitle: z.string().trim().max(200).optional(),
    linkedInContext: z.string().trim().max(12_000).optional(),
    studentGoal: z.string().trim().max(4_000).optional(),
  })
  .strict();
export type DraftOutreachInput = z.infer<typeof DraftOutreachSchema>;

const SummarySchema = z
  .object({
    topics: z.array(z.string().trim().max(500)).max(50).optional(),
    adviceGiven: z.array(z.string().trim().max(500)).max(50).optional(),
    commitments: z.array(z.string().trim().max(500)).max(50).optional(),
    personalDetails: z.array(z.string().trim().max(500)).max(50).optional(),
  })
  .strict();

/** draft-followup — drafts a warm follow-up referencing a structured chat summary. */
export const DraftFollowupSchema = z
  .object({
    contactName: z.string().trim().min(1).max(200),
    contactFirm: z.string().trim().min(1).max(200),
    contactTitle: z.string().trim().min(1).max(200),
    contactSchool: z.string().trim().max(200).optional(),
    summary: SummarySchema,
    studentName: z.string().trim().max(200).optional(),
  })
  .strict();
export type DraftFollowupInput = z.infer<typeof DraftFollowupSchema>;

/** structure-chat — turns raw chat notes into a structured memory record.
 *
 * `contactId` and `chatId` are optional so the request shape stays
 * backwards-compatible. When BOTH are present, the route fires off a
 * fire-and-forget embedding-and-store call so the chat is later recallable
 * via pgvector. Clients without these IDs (e.g. the seeded demo flow) keep
 * working unchanged — no embedding is written.
 */
export const StructureChatSchema = z
  .object({
    contactName: z.string().trim().min(1).max(200),
    contactFirm: z.string().trim().min(1).max(200),
    contactTitle: z.string().trim().min(1).max(200),
    rawNotes: z.string().trim().min(1).max(20_000),
    contactId: z.string().trim().min(1).max(200).optional(),
    chatId: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
export type StructureChatInput = z.infer<typeof StructureChatSchema>;

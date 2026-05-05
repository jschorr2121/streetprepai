import { z } from "zod";

/**
 * A single chat turn from the client. The role/content are passed through to
 * the model SDK as structured `messages` (no template interpolation), so we
 * only enforce shape and reasonable size — no `wrapUserText` needed.
 */
const ChatTurnSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(8_000),
  })
  .strict();

/**
 * chat/stream — guide-scoped Claude streaming chat.
 *
 * `guideTitle` and `guideContent` are interpolated into the system block,
 * so the route must wrap them with `capText` / `wrapUserText` before use.
 */
export const ChatStreamSchema = z
  .object({
    guideTitle: z.string().max(2_000),
    guideContent: z.string().max(120_000),
    messages: z.array(ChatTurnSchema).min(1).max(50),
  })
  .strict();
export type ChatStreamInput = z.infer<typeof ChatStreamSchema>;

/**
 * chat/general — OpenAI tool-use assistant. Profile data is loaded server-side
 * from the user's own row (already trusted), so only the messages array needs
 * client-side validation.
 */
export const ChatGeneralSchema = z
  .object({
    messages: z.array(ChatTurnSchema).min(1).max(50),
  })
  .strict();
export type ChatGeneralInput = z.infer<typeof ChatGeneralSchema>;

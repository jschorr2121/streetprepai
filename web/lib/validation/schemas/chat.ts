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
 * chat/assistant — standalone AI SDK chatbot (Unit 9). The client sends only
 * the newest user turn (a UIMessage); the server reloads prior turns from
 * `chat_messages`, so client-supplied history can't be spoofed. Unknown keys
 * on the message/parts are tolerated (the AI SDK adds fields like `state`)
 * but only the validated fields are ever used.
 */
export const AssistantChatSchema = z
  .object({
    threadId: z.uuid(),
    message: z.looseObject({
      id: z.string().max(200),
      role: z.literal("user"),
      parts: z
        .array(z.looseObject({ type: z.literal("text"), text: z.string().min(1).max(8_000) }))
        .min(1)
        .max(10),
    }),
  })
  .strict();
export type AssistantChatInput = z.infer<typeof AssistantChatSchema>;

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

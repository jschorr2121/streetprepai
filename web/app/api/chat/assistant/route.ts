import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { MODELS } from "@/lib/ai/anthropic";
import { ASSISTANT_SYSTEM } from "@/lib/ai/prompts";
import { logUsage, sdkUsageToTokenUsage } from "@/lib/ai/usage";
import { withUser } from "@/lib/db/client";
import {
  appendMessages,
  createThread,
  getMessages,
  getThread,
  type StoredPart,
} from "@/lib/db/queries/chat";
import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { AssistantChatSchema } from "@/lib/validation/schemas/chat";

export const runtime = "nodejs";

const ENDPOINT = "chat/assistant";

function textParts(parts: Array<{ type?: string; text?: unknown }>): StoredPart[] {
  return parts.flatMap((p) =>
    p.type === "text" && typeof p.text === "string" && p.text.length > 0
      ? [{ type: "text" as const, text: p.text }]
      : [],
  );
}

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: ENDPOINT });
  if (!gate.ok) return gate.response;
  const userId = gate.user.id;

  const parsed = await parseJson(req, AssistantChatSchema);
  if (!parsed.ok) return parsed.response;
  const { threadId, message } = parsed.data;

  const userParts = textParts(message.parts);
  if (userParts.length === 0) {
    return Response.json({ error: "Message has no text" }, { status: 400 });
  }
  const title = userParts[0]!.text.slice(0, 60);

  // Load history and persist the user turn BEFORE the model call, in one
  // transaction — the user's message survives even if the stream fails.
  const prior = await withUser({ sub: userId, role: "authenticated" }, async (tx) => {
    const existing = await getThread(tx, userId, threadId);
    if (!existing) await createThread(tx, userId, threadId, title);
    const history = existing ? await getMessages(tx, userId, threadId) : [];
    await appendMessages(tx, userId, threadId, [{ role: "user", parts: userParts }]);
    return history;
  });

  const uiMessages: UIMessage[] = [...prior, { id: message.id, role: "user", parts: userParts }];

  const result = streamText({
    model: anthropic(MODELS.sonnet),
    system: ASSISTANT_SYSTEM,
    messages: await convertToModelMessages(uiMessages),
    maxOutputTokens: 1_200,
    onEnd: ({ usage }) => {
      logUsage({
        model: MODELS.sonnet,
        usage: sdkUsageToTokenUsage(usage),
        endpoint: ENDPOINT,
        userId,
      });
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: uiMessages,
    onEnd: async ({ responseMessage }) => {
      const parts = textParts(responseMessage.parts);
      if (parts.length === 0) return;
      try {
        await withUser({ sub: userId, role: "authenticated" }, (tx) =>
          appendMessages(tx, userId, threadId, [{ role: "assistant", parts }]),
        );
      } catch (err) {
        console.error("[chat/assistant] failed to persist assistant message:", err);
      }
    },
  });
}

import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";

import { MODELS } from "@/lib/ai/anthropic";
import { buildAssistantTools } from "@/lib/ai/assistant-tools";
import { ASSISTANT_SYSTEM } from "@/lib/ai/prompts";
import { WEB_SEARCH_PER_CALL_USD } from "@/lib/ai/pricing";
import { logUsage, sdkUsageToTokenUsage } from "@/lib/ai/usage";
import { withUser } from "@/lib/db/client";
import {
  appendMessages,
  createThread,
  getMessages,
  getThread,
  toStoredParts,
  type StoredPart,
} from "@/lib/db/queries/chat";
import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { AssistantChatSchema } from "@/lib/validation/schemas/chat";

export const runtime = "nodejs";

const ENDPOINT = "chat/assistant";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: ENDPOINT });
  if (!gate.ok) return gate.response;
  const userId = gate.user.id;

  const parsed = await parseJson(req, AssistantChatSchema);
  if (!parsed.ok) return parsed.response;
  const { threadId, message } = parsed.data;

  const userParts = toStoredParts(message.parts).filter(
    (p): p is Extract<StoredPart, { type: "text" }> => p.type === "text",
  );
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

  const tools = {
    ...buildAssistantTools(userId),
    // Anthropic's server-side web search (locked vendor decision) — capped to
    // bound the per-search surcharge. 20250305 is the version claude-sonnet-4-6
    // supports; revisit when MODELS.sonnet moves.
    web_search: anthropic.tools.webSearch_20250305({ maxUses: 3 }),
  };

  const result = streamText({
    model: anthropic(MODELS.sonnet),
    system: ASSISTANT_SYSTEM,
    messages: await convertToModelMessages(uiMessages, {
      tools,
      ignoreIncompleteToolCalls: true,
    }),
    tools,
    // Tool-loop budget: enough for a couple of lookups + the final answer.
    stopWhen: stepCountIs(6),
    maxOutputTokens: 1_200,
    onEnd: ({ usage, content }) => {
      // Web searches are billed per call on top of tokens.
      const searches = content.filter(
        (p) => p.type === "tool-result" && p.toolName === "web_search",
      ).length;
      logUsage({
        model: MODELS.sonnet,
        usage: sdkUsageToTokenUsage(usage),
        endpoint: ENDPOINT,
        userId,
        surchargeUsd: searches * WEB_SEARCH_PER_CALL_USD,
      });
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: uiMessages,
    // Forward source parts so web-search citations reach the client.
    sendSources: true,
    onEnd: async ({ responseMessage }) => {
      // Persist text + settled tool parts; transient states are dropped.
      const parts = toStoredParts(responseMessage.parts);
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

import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";

import { MODELS } from "@/lib/ai/anthropic";
import { buildAssistantTools } from "@/lib/ai/assistant-tools";
import { generateThreadTitle } from "@/lib/ai/chat-title";
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
  updateThreadTitle,
  type StoredPart,
} from "@/lib/db/queries/chat";
import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { AssistantChatSchema } from "@/lib/validation/schemas/chat";

export const runtime = "nodejs";

const ENDPOINT = "chat/assistant";
const MODEL_CONTEXT_MESSAGES = 30;

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
  // `isNewThread` gates LLM auto-titling below: only the first exchange
  // gets a generated title: later turns keep whatever title already stuck.
  let isNewThread = false;
  const prior = await withUser({ sub: userId, role: "authenticated" }, async (tx) => {
    const existing = await getThread(tx, userId, threadId);
    isNewThread = !existing;
    if (!existing) await createThread(tx, userId, threadId, title);
    const history = existing ? await getMessages(tx, userId, threadId) : [];
    await appendMessages(tx, userId, threadId, [{ role: "user", parts: userParts }]);
    return history;
  });

  const uiMessages: UIMessage[] = [...prior, { id: message.id, role: "user", parts: userParts }];

  // Bound per-turn token cost on long threads: the model sees a rolling window
  // (whole messages, so tool call/result pairs stay intact); the UI and DB keep
  // the full history. 30 turns ≈ well under the cap even with tool payloads.
  const modelContext = uiMessages.slice(-MODEL_CONTEXT_MESSAGES);

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
    messages: await convertToModelMessages(modelContext, {
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

  // Drain the model stream to completion server-side, independent of the client
  // connection. streamText's `onEnd` (usage logging above) only fires when the
  // event-processor stream finishes; if the client disconnects mid-stream that
  // stream is never drained and the expensive sonnet call logs $0 — a spend-cap
  // bypass, since assertUnderQuota sums ai_usage. Meanwhile the response's own
  // `onEnd` (persist + title) still fires on cancel, so an aborted request would
  // otherwise persist a partial reply and bill a haiku title while logging
  // nothing for the main call. consumeStream tees a branch off the same source
  // and pulls it through to the end, guaranteeing usage is always logged. This
  // is the documented AI SDK pattern for reliable persistence/usage on abort.
  // Fire-and-forget: consumeStream internally routes any error to onError.
  void result.consumeStream({
    onError: (err) => console.error("[chat/assistant] consumeStream error:", err),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: uiMessages,
    // Forward source parts so web-search citations reach the client.
    sendSources: true,
    onEnd: async ({ responseMessage }) => {
      // Persist text + settled tool parts; transient states are dropped.
      const parts = toStoredParts(responseMessage.parts);
      if (parts.length === 0) return;
      let persisted = false;
      try {
        await withUser({ sub: userId, role: "authenticated" }, (tx) =>
          appendMessages(tx, userId, threadId, [{ role: "assistant", parts }]),
        );
        persisted = true;
      } catch (err) {
        console.error("[chat/assistant] failed to persist assistant message:", err);
      }

      // LLM auto-titling: only on the thread's first exchange, replacing the
      // truncated-message fallback set at creation. Runs after the response
      // has already been streamed to the client, inside this request's
      // lifecycle — no new client-callable route, no new rate limiter (the
      // `expensive` tier gate above already bounds this request). Best
      // effort only: any failure is caught and logged, and the fallback
      // title set at thread creation stands. Skipped when the assistant reply
      // failed to persist — don't spend a title call on a thread whose first
      // exchange isn't stored.
      if (isNewThread && persisted) {
        try {
          const assistantText = parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join(" ");
          const generated = await generateThreadTitle({
            userText: userParts[0]!.text,
            assistantText: assistantText.length > 0 ? assistantText : undefined,
            userId,
          });
          if (generated) {
            await withUser({ sub: userId, role: "authenticated" }, (tx) =>
              updateThreadTitle(tx, userId, threadId, generated),
            );
          }
        } catch (err) {
          console.error("[chat/assistant] failed to generate thread title:", err);
        }
      }
    },
  });
}

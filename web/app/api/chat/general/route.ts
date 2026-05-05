import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { ChatGeneralSchema } from "@/lib/validation/schemas/chat";
import { getOpenAI, OPENAI_MODELS } from "@/lib/ai/openai";
import { ASSISTANT_TOOLS_OPENAI } from "@/lib/ai/assistant-tools-openai";
import { executeTool } from "@/lib/ai/assistant-tools";
import { getProfile } from "@/lib/data/profile";
import { logUsage } from "@/lib/ai/usage";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "chat/general" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, ChatGeneralSchema);
  if (!parsed.ok) return parsed.response;

  const openai = getOpenAI();
  const profile = await getProfile(gate.user.id);

  const systemContent = [
    `You are Street Prep AI, a specialized advisor for investment banking recruiting.`,
    `The student is ${profile.fullName ?? "a student"} at ${profile.school ?? "their school"}.`,
    `Use the available tools to look up contacts, applied jobs, and chat logs when relevant.`,
    `Be specific, actionable, and concise. Speak like a respected mentor, not a robot.`,
  ].join("\n");

  const messages: Parameters<typeof openai.chat.completions.create>[0]["messages"] = [
    { role: "system", content: systemContent },
    ...parsed.data.messages,
  ];

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();

      function write(chunk: unknown) {
        controller.enqueue(enc.encode(JSON.stringify(chunk) + "\n"));
      }

      try {
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        // Agentic loop: run until stop or max iterations.
        for (let turn = 0; turn < 5; turn++) {
          const resp = await openai.chat.completions.create({
            model: OPENAI_MODELS.nano,
            messages,
            tools: ASSISTANT_TOOLS_OPENAI.length > 0 ? ASSISTANT_TOOLS_OPENAI : undefined,
            tool_choice: ASSISTANT_TOOLS_OPENAI.length > 0 ? "auto" : undefined,
          });

          totalInputTokens += resp.usage?.prompt_tokens ?? 0;
          totalOutputTokens += resp.usage?.completion_tokens ?? 0;

          const choice = resp.choices[0];
          if (!choice) break;

          const msg = choice.message;
          if (msg.content) {
            write({ type: "text", text: msg.content });
          }

          if (choice.finish_reason === "stop" || !msg.tool_calls?.length) {
            break;
          }

          // Execute tool calls and continue the loop.
          messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });
          for (const call of msg.tool_calls) {
            if (call.type !== "function") continue;
            let result: unknown;
            try {
              result = await executeTool(gate.user.id, call.function.name, JSON.parse(call.function.arguments ?? "{}"));
            } catch (e) {
              result = { error: e instanceof Error ? e.message : "tool error" };
            }
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify(result),
            });
          }
        }

        logUsage({
          model: OPENAI_MODELS.nano,
          usage: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens },
          endpoint: "chat/general",
          userId: gate.user.id,
        });

        write({ type: "done" });
      } catch (err) {
        console.error("[chat/general]", err);
        write({ type: "error", message: err instanceof Error ? err.message : "unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

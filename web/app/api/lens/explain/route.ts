import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { LensExplainSchema } from "@/lib/validation/schemas/lens";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { LENS_EXPLAIN_SYSTEM } from "@/lib/ai/prompts";
import { trackStream } from "@/lib/ai/usage";
import { wrapUserText, capText } from "@/lib/ai/sanitize";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "lens/explain" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, LensExplainSchema);
  if (!parsed.ok) return parsed.response;

  const { guideTitle, sectionHeading, selection, surroundingContext, question } = parsed.data;

  const client = getAnthropic();

  const userPrompt = [
    `Guide: ${capText(guideTitle, 300)}`,
    sectionHeading ? `Section: ${capText(sectionHeading, 300)}` : null,
    surroundingContext
      ? `Surrounding context:\n${wrapUserText(surroundingContext, "context", { maxChars: 12000 })}`
      : null,
    `The student highlighted this passage:\n${wrapUserText(selection, "selection", { maxChars: 4000 })}`,
    question
      ? `Their follow-up question: ${capText(question, 1000)}`
      : `Explain this passage in plain English.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const stream = await client.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 800,
    system: [
      {
        type: "text",
        text: LENS_EXPLAIN_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  trackStream(stream, "lens/explain", { userId: gate.user.id });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `\n\n[Error: ${err instanceof Error ? err.message : "stream failed"}]`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

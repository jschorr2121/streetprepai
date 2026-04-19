import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { LENS_EXPLAIN_SYSTEM } from "@/lib/ai/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    guideTitle: string;
    sectionHeading?: string;
    selection: string;
    surroundingContext?: string;
    question?: string;
  };

  const client = getAnthropic();

  const userPrompt = [
    `Guide: ${body.guideTitle}`,
    body.sectionHeading ? `Section: ${body.sectionHeading}` : null,
    body.surroundingContext
      ? `Surrounding context:\n"""${body.surroundingContext}"""`
      : null,
    `The student highlighted this passage:\n"""${body.selection}"""`,
    body.question
      ? `Their follow-up question: ${body.question}`
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

import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { LENS_BEGINNER_SYSTEM } from "@/lib/ai/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    guideTitle: string;
    sectionHeading: string;
    sectionContent: string;
  };

  const client = getAnthropic();

  const stream = await client.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 1200,
    system: [
      {
        type: "text",
        text: LENS_BEGINNER_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Guide: ${body.guideTitle}\nSection: ${body.sectionHeading}\n\nOriginal passage:\n"""${body.sectionContent}"""\n\nRewrite this section in plain, beginner-friendly language following the rules. Keep the same section-level heading off (it's already shown elsewhere).`,
      },
    ],
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

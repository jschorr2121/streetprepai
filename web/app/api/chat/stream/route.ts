import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { CHAT_SYSTEM } from "@/lib/ai/prompts";

export const runtime = "nodejs";

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const body = (await req.json()) as {
    guideTitle: string;
    guideContent: string;
    messages: Message[];
  };

  const client = getAnthropic();

  const system = [
    { type: "text" as const, text: CHAT_SYSTEM },
    {
      type: "text" as const,
      text: `The student is reading this guide:\n\n# ${body.guideTitle}\n\n${body.guideContent}`,
      cache_control: { type: "ephemeral" as const },
    },
  ];

  const stream = await client.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 700,
    system,
    messages: body.messages,
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

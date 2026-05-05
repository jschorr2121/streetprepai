import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { LensBeginnerSchema } from "@/lib/validation/schemas/lens";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { LENS_BEGINNER_SYSTEM } from "@/lib/ai/prompts";
import { trackStream } from "@/lib/ai/usage";
import { wrapUserText, capText } from "@/lib/ai/sanitize";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "lens/beginner" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, LensBeginnerSchema);
  if (!parsed.ok) return parsed.response;

  const { guideTitle, sectionHeading, sectionContent } = parsed.data;

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
        content: `Guide: ${capText(guideTitle, 300)}\nSection: ${capText(sectionHeading, 300)}\n\nOriginal passage:\n${wrapUserText(sectionContent, "passage", { maxChars: 12000 })}\n\nRewrite this section in plain, beginner-friendly language following the rules. Keep the same section-level heading off (it's already shown elsewhere).`,
      },
    ],
  });

  trackStream(stream, "lens/beginner", { userId: gate.user.id });

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

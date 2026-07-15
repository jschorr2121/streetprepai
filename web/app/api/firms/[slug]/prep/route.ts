import { requireUser } from "@/lib/security/require-user";
import { clientSafeError } from "@/lib/security/client-error";
import { parseJson } from "@/lib/validation/parse";
import { FirmSlugSchema } from "@/lib/validation/schemas/firms";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { PREP_FIRM_SYSTEM } from "@/lib/ai/prompts";
import { trackStream } from "@/lib/ai/usage";
import { getFirmBySlug } from "@/lib/data/firms";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "firms/prep" });
  if (!gate.ok) return gate.response;

  const { slug } = await params;
  const slugParsed = FirmSlugSchema.safeParse(slug);
  if (!slugParsed.success) {
    return Response.json({ error: "invalid slug" }, { status: 400 });
  }

  const firm = await getFirmBySlug(slugParsed.data);
  if (!firm) {
    return Response.json({ error: "firm not found" }, { status: 404 });
  }

  const client = getAnthropic();

  const userPrompt = [
    `Firm: ${firm.name}`,
    `Tier: ${firm.tier}`,
    `HQ: ${firm.hq}`,
    `Background:\n${firm.description}`,
    "",
    `Latest public-disclosure content (earnings release / press):\n"""${firm.latestEarningsRaw ?? "(no recent earnings content available)"}"""`,
    "",
    `Produce the firm interview prep sheet.`,
  ].join("\n");

  const stream = await client.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 1400,
    system: [
      {
        type: "text",
        text: PREP_FIRM_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  trackStream(stream, "firms/prep", { userId: gate.user.id });

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
            `\n\n[Error: ${clientSafeError("firms/prep", err, "The response failed. Please try again.")}]`,
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

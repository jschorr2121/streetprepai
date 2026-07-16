import { requireUser } from "@/lib/security/require-user";
import { FirmSlugSchema } from "@/lib/validation/schemas/firms";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { PREP_FIRM_SYSTEM } from "@/lib/ai/prompts";
import { trackStream } from "@/lib/ai/usage";
import { wrapUserText } from "@/lib/ai/sanitize";
import { streamTextResponse } from "@/lib/ai/stream-response";
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
    // Earnings text is third-party content (scraped releases/press) — isolate
    // it like any untrusted input so it can't smuggle instructions.
    `Latest public-disclosure content (earnings release / press):\n${wrapUserText(firm.latestEarningsRaw ?? "(no recent earnings content available)", "earnings_content", { maxChars: 40_000 })}`,
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

  return streamTextResponse(stream, "firms/prep");
}

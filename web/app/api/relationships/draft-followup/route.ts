import { requireUser } from "@/lib/security/require-user";
import { clientSafeError } from "@/lib/security/client-error";
import { parseJson } from "@/lib/validation/parse";
import { DraftFollowupSchema } from "@/lib/validation/schemas/relationships";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { DRAFT_FOLLOWUP_SYSTEM } from "@/lib/ai/prompts";
import { logUsage } from "@/lib/ai/usage";
import { capText } from "@/lib/ai/sanitize";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "relationships/draft-followup" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, DraftFollowupSchema);
  if (!parsed.ok) return parsed.response;

  const { contactName, contactFirm, contactTitle, contactSchool, summary, studentName } =
    parsed.data;

  const client = getAnthropic();

  const summaryText = [
    summary.topics?.length ? `Topics discussed: ${summary.topics.join("; ")}` : null,
    summary.adviceGiven?.length ? `Advice given: ${summary.adviceGiven.join("; ")}` : null,
    summary.commitments?.length ? `Commitments from them: ${summary.commitments.join("; ")}` : null,
    summary.personalDetails?.length
      ? `Personal details: ${summary.personalDetails.join("; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = [
    `Draft a follow-up email from the student to ${capText(contactName, 200)} (${capText(contactTitle, 200)}, ${capText(contactFirm, 200)})${contactSchool ? `, a ${capText(contactSchool, 200)} alum` : ""}.`,
    "",
    `Conversation summary:`,
    summaryText || "(no structured summary available)",
    "",
    `Student name: ${capText(studentName ?? "Jake", 200)}`,
  ].join("\n");

  let response;
  try {
    response = await client.messages.create({
      model: MODELS.haiku,
      max_tokens: 400,
      system: DRAFT_FOLLOWUP_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    return Response.json(
      {
        error: clientSafeError(
          "relationships/draft-followup",
          err,
          "The AI request failed. Please try again.",
        ),
      },
      { status: 502 },
    );
  }

  logUsage({
    model: MODELS.haiku,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? undefined,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? undefined,
    },
    endpoint: "relationships/draft-followup",
    userId: gate.user.id,
  });

  const text = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("");

  const subjectMatch = text.match(/^Subject:\s*(.+)$/m);
  const subject = subjectMatch?.[1]?.trim() ?? "Thank you";
  const body = text.replace(/^Subject:\s*.+$/m, "").trim();

  return Response.json({ subject, body });
}

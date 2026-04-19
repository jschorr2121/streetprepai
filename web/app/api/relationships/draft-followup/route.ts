import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { DRAFT_FOLLOWUP_SYSTEM } from "@/lib/ai/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    contactName: string;
    contactFirm: string;
    contactTitle: string;
    contactSchool?: string;
    summary: {
      topics?: string[];
      adviceGiven?: string[];
      commitments?: string[];
      personalDetails?: string[];
    };
    studentName?: string;
  };

  const client = getAnthropic();

  const summaryText = [
    body.summary.topics?.length
      ? `Topics discussed: ${body.summary.topics.join("; ")}`
      : null,
    body.summary.adviceGiven?.length
      ? `Advice given: ${body.summary.adviceGiven.join("; ")}`
      : null,
    body.summary.commitments?.length
      ? `Commitments from them: ${body.summary.commitments.join("; ")}`
      : null,
    body.summary.personalDetails?.length
      ? `Personal details: ${body.summary.personalDetails.join("; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = [
    `Draft a follow-up email from the student to ${body.contactName} (${body.contactTitle}, ${body.contactFirm})${body.contactSchool ? `, a ${body.contactSchool} alum` : ""}.`,
    "",
    `Conversation summary:`,
    summaryText || "(no structured summary available)",
    "",
    `Student name: ${body.studentName ?? "Jake"}`,
  ].join("\n");

  const response = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 400,
    system: DRAFT_FOLLOWUP_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("");

  const subjectMatch = text.match(/^Subject:\s*(.+)$/m);
  const subject = subjectMatch ? subjectMatch[1].trim() : "Thank you";
  const body_ = text
    .replace(/^Subject:\s*.+$/m, "")
    .trim();

  return Response.json({ subject, body: body_ });
}

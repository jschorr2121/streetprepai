import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { PrepPersonSchema } from "@/lib/validation/schemas/relationships";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { PREP_PERSON_SYSTEM } from "@/lib/ai/prompts";
import { trackStream } from "@/lib/ai/usage";
import { wrapUserText, capText } from "@/lib/ai/sanitize";
import { streamTextResponse } from "@/lib/ai/stream-response";
import { findSimilarChats } from "@/lib/data/semantic-recall";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "relationships/prep-person" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, PrepPersonSchema);
  if (!parsed.ok) return parsed.response;

  const { name, firm, title, group, school, bio, studentContext, contactId } = parsed.data;

  // Semantic recall: if contactId is provided, enrich the prompt with past chats.
  let pastChatsBlock = "";
  if (contactId) {
    const queryText = [name, firm, title, group].filter(Boolean).join(", ");
    const hits = await findSimilarChats({
      userId: gate.user.id,
      contactId,
      queryText,
      k: 3,
    });
    if (hits.length > 0) {
      const chatLines = hits.map(
        (h) => `[similarity ${h.similarity.toFixed(2)}]\n${h.summaryText}`,
      );
      pastChatsBlock = `\nPast conversations with this contact:\n<past_chats>\n${chatLines.join("\n\n")}\n</past_chats>`;
    }
  }

  const client = getAnthropic();

  const userPrompt = [
    `Student is preparing to meet:`,
    `- Name: ${capText(name, 200)}`,
    `- Firm: ${capText(firm, 200)}`,
    `- Title: ${capText(title, 200)}`,
    group ? `- Group: ${capText(group, 200)}` : null,
    school ? `- School: ${capText(school, 200)}` : null,
    "",
    bio
      ? `LinkedIn / bio text they shared:\n${wrapUserText(bio, "bio", { maxChars: 12000 })}`
      : null,
    studentContext
      ? `Student context:\n${wrapUserText(studentContext, "student_context", { maxChars: 4000 })}`
      : `Student context: Undergraduate targeting IB Summer Analyst roles.`,
    pastChatsBlock || null,
    "",
    `Produce the prep sheet.`,
  ]
    .filter((x) => x !== null)
    .join("\n");

  const stream = await client.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 1200,
    system: [
      {
        type: "text",
        text: PREP_PERSON_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  trackStream(stream, "relationships/prep-person", { userId: gate.user.id });

  return streamTextResponse(stream, "relationships/prep-person");
}

import { requireUser } from "@/lib/security/require-user";
import { clientSafeError } from "@/lib/security/client-error";
import { parseJson } from "@/lib/validation/parse";
import {
  ChatSummaryOutputSchema,
  StructureChatSchema,
} from "@/lib/validation/schemas/relationships";
import { getAnthropic, MODELS } from "@/lib/ai/anthropic";
import { STRUCTURE_CHAT_SYSTEM } from "@/lib/ai/prompts";
import { logUsage } from "@/lib/ai/usage";
import { wrapUserText, capText } from "@/lib/ai/sanitize";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "expensive", route: "relationships/structure-chat" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, StructureChatSchema);
  if (!parsed.ok) return parsed.response;

  const { contactName, contactFirm, contactTitle, rawNotes, contactId, chatId } = parsed.data;

  const client = getAnthropic();

  let response;
  try {
    response = await client.messages.create({
      model: MODELS.sonnet,
      max_tokens: 1500,
      system: STRUCTURE_CHAT_SYSTEM,
      tools: [
        {
          name: "save_chat_summary",
          description: "Save the structured summary of the coffee chat.",
          input_schema: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                items: { type: "string" },
                description: "Main topics covered in the conversation.",
              },
              adviceGiven: {
                type: "array",
                items: { type: "string" },
                description: "Specific pieces of advice the banker gave the student.",
              },
              commitments: {
                type: "array",
                items: { type: "string" },
                description:
                  "Things the banker said they would do (intros, resources, follow-ups).",
              },
              personalDetails: {
                type: "array",
                items: { type: "string" },
                description:
                  "Personal details about the banker worth remembering next time (family, hobbies, hometown, interests).",
              },
              followUps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    dueBy: {
                      type: "string",
                      description: "ISO date if a due date is implied.",
                    },
                  },
                  required: ["description"],
                },
                description: "Action items the student should complete after this chat.",
              },
            },
            required: ["topics", "adviceGiven", "commitments", "personalDetails", "followUps"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "save_chat_summary" },
      messages: [
        {
          role: "user",
          content: `Contact: ${capText(contactName, 200)}, ${capText(contactTitle, 200)} at ${capText(contactFirm, 200)}.\n\nRaw notes the student just jotted down:\n${wrapUserText(rawNotes, "raw_notes", { maxChars: 20000 })}\n\nStructure these into a memory record.`,
        },
      ],
    });
  } catch (err) {
    return Response.json(
      {
        error: clientSafeError(
          "relationships/structure-chat",
          err,
          "The AI request failed. Please try again.",
        ),
      },
      { status: 502 },
    );
  }

  logUsage({
    model: MODELS.sonnet,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? undefined,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? undefined,
    },
    endpoint: "relationships/structure-chat",
    userId: gate.user.id,
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return Response.json(
      { error: "Model did not call the save_chat_summary tool." },
      { status: 502 },
    );
  }

  // Tool output is untrusted model output — validate before embedding/returning.
  const summary = ChatSummaryOutputSchema.safeParse(toolUse.input);
  if (!summary.success) {
    console.error("[relationships/structure-chat] invalid tool output:", summary.error.issues);
    return Response.json(
      { error: "The AI returned an invalid summary. Please try again." },
      { status: 502 },
    );
  }

  // Fire-and-forget embedding when both contactId and chatId are present.
  if (contactId && chatId) {
    void (async () => {
      try {
        const { embedText, summaryEmbedText } = await import("@/lib/ai/embeddings");
        const { getAdminClient } = await import("@/lib/supabase/admin");
        const admin = getAdminClient();
        if (!admin) return;

        // Ownership check: the service-role client bypasses RLS, and chat_id is
        // the table's PK — without this, a forged chatId could overwrite
        // another user's embedding row.
        const { data: chatRow } = await admin
          .from("chats")
          .select("id")
          .eq("id", chatId)
          .eq("user_id", gate.user.id)
          .eq("contact_id", contactId)
          .maybeSingle();
        if (!chatRow) {
          console.warn(
            `[relationships/structure-chat] embedding skipped: chat ${chatId} not owned by user`,
          );
          return;
        }

        const text = summaryEmbedText(summary.data);
        const embedding = await embedText(text, {
          userId: gate.user.id,
          endpoint: "embed/structure-chat",
        });
        await admin.from("chat_embeddings").upsert({
          chat_id: chatId,
          contact_id: contactId,
          user_id: gate.user.id,
          embedding,
          summary_text: text,
        });
      } catch (err) {
        // Embedding is best-effort; the structured summary already succeeded.
        console.error("[relationships/structure-chat] embedding failed:", err);
      }
    })();
  }

  return Response.json(summary.data);
}

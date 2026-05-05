import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { ExtractResumeSchema } from "@/lib/validation/schemas/profile";
import { getOpenAI } from "@/lib/ai/openai";
import { logUsage } from "@/lib/ai/usage";
import { wrapUserText } from "@/lib/ai/sanitize";

export const runtime = "nodejs";

const SYSTEM = `You are a resume parser. Extract structured data from the resume text and return valid JSON with this shape:
{
  "fullName": "string or null",
  "school": "string or null",
  "graduationYear": number or null,
  "experiences": [{ "company": string, "role": string, "startDate": string?, "endDate": string?, "bullets": string[] }],
  "education": [{ "school": string, "degree": string?, "field": string?, "graduationYear": number?, "gpa": number? }],
  "skills": string[],
  "targetRoles": string[],
  "targetFirms": string[],
  "suggestedBioSummary": "string or null"
}
Only return JSON. No markdown, no explanation.`;

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "cheap", route: "profile/extract-resume" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, ExtractResumeSchema);
  if (!parsed.ok) return parsed.response;

  const openai = getOpenAI();
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-nano",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: wrapUserText(parsed.data.rawText, "resume", { maxChars: 25000 }) },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    logUsage({
      model: "gpt-5.4-nano",
      usage: {
        input_tokens: completion.usage?.prompt_tokens ?? 0,
        output_tokens: completion.usage?.completion_tokens ?? 0,
      },
      endpoint: "profile/extract-resume",
      userId: gate.user.id,
    });

    let structured: unknown;
    try {
      structured = JSON.parse(content);
    } catch {
      structured = {};
    }

    return Response.json(structured);
  } catch (err) {
    console.error("[profile/extract-resume]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

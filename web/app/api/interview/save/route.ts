import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { InterviewSaveSchema } from "@/lib/validation/schemas/interview";
import { saveMockInterview } from "@/lib/data/mock-interviews";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "cheap", route: "interview/save" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, InterviewSaveSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const interview = await saveMockInterview(gate.user.id, parsed.data);
    return Response.json(interview);
  } catch (err) {
    console.error("[interview/save]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

import { requireUser } from "@/lib/security/require-user";
import { clientSafeError } from "@/lib/security/client-error";
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
    return Response.json(
      { error: clientSafeError("interview/save", err, "Could not save the interview.") },
      { status: 500 },
    );
  }
}

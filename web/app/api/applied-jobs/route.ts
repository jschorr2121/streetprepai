import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { AppliedJobInputSchema } from "@/lib/validation/schemas/applied-jobs";
import { getAppliedJobs, addAppliedJob } from "@/lib/data/applied-jobs";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "cheap", route: "applied-jobs" });
  if (!gate.ok) return gate.response;

  try {
    const jobs = await getAppliedJobs(gate.user.id);
    return Response.json({ jobs });
  } catch (err) {
    console.error("[applied-jobs GET]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "cheap", route: "applied-jobs" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, AppliedJobInputSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const job = await addAppliedJob(gate.user.id, parsed.data);
    return Response.json(job);
  } catch (err) {
    console.error("[applied-jobs POST]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

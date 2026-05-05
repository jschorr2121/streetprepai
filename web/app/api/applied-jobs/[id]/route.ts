import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { AppliedJobPatchSchema } from "@/lib/validation/schemas/applied-jobs";
import { updateAppliedJob, removeAppliedJob } from "@/lib/data/applied-jobs";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalidId(): Response {
  return Response.json({ error: "invalid id" }, { status: 400 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const gate = await requireUser(req, { tier: "cheap", route: "applied-jobs/[id]" });
  if (!gate.ok) return gate.response;

  const { id } = await params;
  if (!UUID_RE.test(id)) return invalidId();

  const parsed = await parseJson(req, AppliedJobPatchSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const job = await updateAppliedJob(gate.user.id, id, parsed.data);
    return Response.json(job);
  } catch (err) {
    console.error("[applied-jobs/[id] PATCH]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const gate = await requireUser(req, { tier: "cheap", route: "applied-jobs/[id]" });
  if (!gate.ok) return gate.response;

  const { id } = await params;
  if (!UUID_RE.test(id)) return invalidId();

  try {
    await removeAppliedJob(gate.user.id, id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[applied-jobs/[id] DELETE]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

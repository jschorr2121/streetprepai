import { requireUser } from "@/lib/security/require-user";
import { parseJson } from "@/lib/validation/parse";
import { ProfileSaveSchema } from "@/lib/validation/schemas/profile";
import { upsertProfile } from "@/lib/data/profile";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "cheap", route: "profile/save" });
  if (!gate.ok) return gate.response;

  const parsed = await parseJson(req, ProfileSaveSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const profile = await upsertProfile(gate.user.id, parsed.data);
    return Response.json(profile);
  } catch (err) {
    console.error("[profile/save]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

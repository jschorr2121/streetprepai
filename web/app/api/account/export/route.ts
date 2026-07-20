import { withUser } from "@/lib/db/client";
import { exportAccountData, type AccountExportData } from "@/lib/db/queries/account-export";
import { clientSafeError } from "@/lib/security/client-error";
import { requireUser } from "@/lib/security/require-user";

export const runtime = "nodejs";

// GET /api/account/export — self-serve "download my data" (GDPR/CCPA
// portability). Streams every user-owned row, grouped by table, as one JSON
// attachment. No AI calls and no request body, so `cheap` is the closest fit
// among the repo's rate tiers (`cheap`/`expensive`/`whisper`/`public`) — it's
// the tier used for non-AI CRUD reads/writes elsewhere. This read is heavier
// than a typical `cheap` route, but a dedicated tier would be new rate-limit
// infra for a single low-traffic route, which is out of scope here.
export async function GET(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "cheap", route: "account/export" });
  if (!gate.ok) return gate.response;
  const userId = gate.user.id;

  let data: AccountExportData;
  try {
    data = await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      exportAccountData(tx, userId),
    );
  } catch (err) {
    return Response.json(
      { error: clientSafeError("account/export", err, "Could not export your data.") },
      { status: 500 },
    );
  }

  const payload = {
    meta: {
      app: "Street Prep AI",
      exportedAt: new Date().toISOString(),
      userId,
      notes: [
        "Embedding vectors are excluded from the `chats` and `chatEmbeddings` tables — " +
          "raw float arrays aren't useful outside the app. The text they were derived " +
          "from (chat notes, structured summaries) is included in full.",
        "No files are stored in Supabase Storage for this account yet, so there are no " +
          "attachments or signed URLs to include.",
      ],
    },
    data,
  };

  const filename = `streetprep-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

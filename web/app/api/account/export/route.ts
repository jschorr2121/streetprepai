import { withUser } from "@/lib/db/client";
import { exportAccountData, type AccountExportData } from "@/lib/db/queries/account-export";
import { accountExportLimiter } from "@/lib/ratelimit/limiters";
import { clientSafeError } from "@/lib/security/client-error";
import { requireUser } from "@/lib/security/require-user";

export const runtime = "nodejs";

// GET /api/account/export — self-serve "download my data" (GDPR/CCPA
// portability). Streams every user-owned row, grouped by table, as one JSON
// attachment. Two limits stack: the `cheap` tier's generic user+IP buckets
// via requireUser, plus a dedicated per-hour budget — each request selects
// every row the user owns across 18 tables and buffers the JSON in memory,
// far heavier than a normal `cheap` read.
export async function GET(req: Request): Promise<Response> {
  const gate = await requireUser(req, { tier: "cheap", route: "account/export" });
  if (!gate.ok) return gate.response;
  const userId = gate.user.id;

  const rl = await accountExportLimiter(userId);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many export requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

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

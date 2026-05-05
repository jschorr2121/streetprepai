// Server-only module: imports the service-role admin client. Do not import
// from a client component. (We don't import `server-only` here because the
// codebase isn't set up to ship that package; the convention across lib/data
// is plain TS modules consumed only by route handlers and RSC.)
import { getAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/ai/embeddings";

export type SimilarChat = {
  chatId: string;
  contactId: string;
  similarity: number;
  summaryText: string;
};

/**
 * Top-k cosine-similar past chats for a given user, optionally scoped to one
 * contact. Returns [] gracefully when:
 *  - admin client is not configured (dev without service-role key)
 *  - the RPC fails (returns Supabase error)
 *  - no rows match
 *
 * Backed by the `match_chat_embeddings` SQL function defined in
 * `scripts/migrations/003_pgvector.sql`. Cosine distance from pgvector
 * (`<=>`) is in [0,2]; we convert to similarity = 1 - distance for the
 * standard "higher is better" semantics.
 */
export async function findSimilarChats(opts: {
  userId: string;
  contactId?: string;
  queryText: string;
  k?: number;
}): Promise<SimilarChat[]> {
  const admin = getAdminClient();
  if (!admin) return [];
  if (!opts.queryText.trim()) return [];

  const k = opts.k ?? 3;

  let queryVec: number[];
  try {
    queryVec = await embedText(opts.queryText, {
      userId: opts.userId,
      endpoint: "embed/recall",
    });
  } catch (err) {
    console.error("[semantic-recall] embed failed:", err instanceof Error ? err.message : err);
    return [];
  }

  const { data, error } = await admin.rpc("match_chat_embeddings", {
    user_id_in: opts.userId,
    contact_id_in: opts.contactId ?? null,
    query_embedding: queryVec,
    match_count: k,
  });
  if (error) {
    console.error("[semantic-recall] rpc failed:", error.message);
    return [];
  }
  type Row = {
    chat_id: string;
    contact_id: string;
    summary_text: string;
    distance: number;
  };
  return ((data ?? []) as Row[]).map((r) => ({
    chatId: r.chat_id,
    contactId: r.contact_id,
    similarity: 1 - r.distance,
    summaryText: r.summary_text,
  }));
}

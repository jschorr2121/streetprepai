/**
 * Wave 5 backfill: embed every existing chat with a non-null structured
 * summary and upsert into `chat_embeddings`. Idempotent (chat_id is the PK).
 *
 * Run with:
 *   pnpm backfill:embeddings
 *
 * Requires:
 *   - SUPABASE_SERVICE_ROLE_KEY (writes bypass RLS)
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - OPENAI_API_KEY
 *
 * The `text-embedding-3-small` cost is ~$0.02 per 1M input tokens; backfilling
 * 10k chats with avg ~150 tokens each is ~$0.03 total.
 */
import { getAdminClient } from "@/lib/supabase/admin";
import { embedText, summaryEmbedText, type ChatSummaryForEmbed } from "@/lib/ai/embeddings";

type ChatRow = {
  id: string;
  user_id: string;
  contact_id: string;
  structured: ChatSummaryForEmbed | null;
};

async function main() {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) required for backfill.",
    );
  }

  const { data: chats, error } = await admin
    .from("chats")
    .select("id, user_id, contact_id, structured")
    .not("structured", "is", null);
  if (error) throw error;

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of (chats ?? []) as ChatRow[]) {
    const summary = c.structured;
    if (!summary) {
      skipped++;
      continue;
    }
    const text = summaryEmbedText(summary);
    if (!text.trim()) {
      skipped++;
      continue;
    }
    try {
      const vec = await embedText(text, {
        userId: c.user_id,
        endpoint: "embed/backfill",
      });
      const { error: upsertErr } = await admin.from("chat_embeddings").upsert({
        chat_id: c.id,
        user_id: c.user_id,
        contact_id: c.contact_id,
        embedding: vec,
        summary_text: text,
      });
      if (upsertErr) {
        console.error(`[backfill] ${c.id}: ${upsertErr.message}`);
        failed++;
      } else {
        done++;
      }
    } catch (err) {
      console.error(`[backfill] ${c.id}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(
    `[backfill] done=${done} skipped=${skipped} failed=${failed} total=${(chats ?? []).length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import type { Executor } from "@/lib/db/client";
import { feedback } from "@/lib/db/schema";

/**
 * Insert one feedback submission from the in-app widget. Write-only from the
 * app's perspective — there's no read path yet (rows are triaged directly in
 * Supabase). Run inside `withUser` so RLS's owner-insert policy applies.
 */
export async function createFeedback(
  db: Executor,
  userId: string,
  route: string,
  message: string,
): Promise<void> {
  await db.insert(feedback).values({ userId, route, message });
}

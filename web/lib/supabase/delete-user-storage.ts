import type { SupabaseClient } from "@supabase/supabase-js";

// Deletes every Storage object a user owns, across the per-user buckets
// documented in architecture.md → Storage Model. Used only by account deletion
// (an explicit admin operation), so it takes the service-role client and
// bypasses RLS by design. Storage cleanup runs BEFORE the auth user is deleted
// so a mid-failure leaves a recoverable state (rows + auth user still intact).

// Buckets that store objects under a `{userId}/...` prefix. Kept in sync with
// the upload paths in architecture.md: resumes/{user_id}/…,
// mock-audio/{user_id}/…, mock-video/{user_id}/….
const USER_STORAGE_BUCKETS = ["resumes", "mock-audio", "mock-video"] as const;

// Supabase Storage `list` caps at 100 rows by default and never recurses, and
// `remove` accepts a bounded batch — page through both.
const LIST_PAGE_SIZE = 100;
const REMOVE_BATCH_SIZE = 1000;

// A not-yet-provisioned bucket is not a cleanup failure — there is simply
// nothing to delete. Distinguished from real faults (network, permission) so
// those still abort the deletion.
function isBucketNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    /bucket not found/i.test(error.message)
  );
}

// Recursively collects the full object paths under `prefix`. Folders come back
// from `list` with a null `id` (no file metadata) — recurse into them; leaves
// are real objects to remove.
async function collectObjectPaths(
  admin: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit: LIST_PAGE_SIZE, offset });
    if (error) throw error;

    const entries = data ?? [];
    for (const entry of entries) {
      const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        paths.push(...(await collectObjectPaths(admin, bucket, entryPath)));
      } else {
        paths.push(entryPath);
      }
    }

    if (entries.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return paths;
}

/**
 * Removes every Storage object owned by `userId`. Throws on any genuine Storage
 * fault (so the caller can abort before deleting the auth user); a missing
 * bucket is treated as "nothing to clean" and skipped.
 */
export async function deleteUserStorageObjects(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  for (const bucket of USER_STORAGE_BUCKETS) {
    let paths: string[];
    try {
      paths = await collectObjectPaths(admin, bucket, userId);
    } catch (err) {
      if (isBucketNotFound(err)) continue;
      throw err;
    }

    for (let i = 0; i < paths.length; i += REMOVE_BATCH_SIZE) {
      const chunk = paths.slice(i, i + REMOVE_BATCH_SIZE);
      const { error } = await admin.storage.from(bucket).remove(chunk);
      if (error) throw error;
    }
  }
}

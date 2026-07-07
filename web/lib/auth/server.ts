import type { User } from "@supabase/supabase-js";

import { UnauthorizedError } from "@/lib/errors";
import { getUser } from "@/lib/supabase/get-user";
import { createClient } from "@/lib/supabase/server";

// Server-side auth helpers for Server Components and Server Actions.
//
// `requireUser()` is the auth-gate at the top of every Server Action (step 1 of
// the code-standards skeleton): it returns the verified user or throws
// `UnauthorizedError`, which the action's top-level try/catch translates into the
// `{ ok: false, error: { code: 'UNAUTHORIZED' } }` failure shape.
//
// Re-exports `UnauthorizedError` from `lib/errors.ts` (the canonical AppError
// subclass) so callers that import it from here continue to work unchanged.
export { UnauthorizedError } from "@/lib/errors";

export async function requireUser(): Promise<User> {
  try {
    return await getUser();
  } catch {
    throw new UnauthorizedError();
  }
}

export async function getCurrentUserOrNull(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

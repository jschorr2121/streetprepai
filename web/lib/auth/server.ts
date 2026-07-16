import type { User } from "@supabase/supabase-js";

import { UnauthorizedError } from "@/lib/errors";
import { getUser, getUserOrNull } from "@/lib/supabase/get-user";

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
  return getUserOrNull();
}

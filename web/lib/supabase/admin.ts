import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only privileged operations (usage
// inserts, future migrations). Bypasses RLS — never import from a
// client component.
//
// Returns null when the service-role key is not configured (typical in
// local dev). Callers must handle null as a graceful no-op rather than
// crashing.

let admin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient | null {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

"use server";

import { redirect } from "next/navigation";

import { logger } from "@/lib/logging/logger";
import { createClient } from "@/lib/supabase/server";

// Signs the user out (clears the Supabase session cookie) and redirects to
// /login. Shared auth action — not colocated with a single route.
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  logger.info({ userId: user?.id ?? "anon", action: "sign_out" }, "sign_out");
  redirect("/login");
}

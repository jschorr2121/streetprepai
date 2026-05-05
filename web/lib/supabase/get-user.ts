import type { User } from "@supabase/supabase-js";
import { createClient } from "./server";

export async function getUser(): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

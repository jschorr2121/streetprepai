import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./server";

// `auth.getUser()` is a network round trip to the Supabase Auth server. The
// (app) layout and every page both call it during a single render pass, so
// without dedup each navigation pays for it twice (plus once in the proxy,
// which runs in a separate context and can't share this cache). React's
// `cache()` memoizes per request; Server Actions and Route Handlers each get
// their own cache, so nothing leaks across requests.
const fetchUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export async function getUser(): Promise<User> {
  const user = await fetchUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function getUserOrNull(): Promise<User | null> {
  return fetchUser();
}

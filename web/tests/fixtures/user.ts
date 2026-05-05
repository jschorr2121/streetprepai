import type { User } from "@supabase/supabase-js";

export function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "test@streetprep.test",
    email_confirmed_at: new Date(0).toISOString(),
    phone: "",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: { full_name: "Test User" },
    identities: [],
    is_anonymous: false,
    ...overrides,
  } as User;
}

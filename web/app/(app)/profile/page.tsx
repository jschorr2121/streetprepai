import { UserCircle } from "lucide-react";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getProfile } from "@/lib/db/queries/profile";

// Page is already force-dynamic via (app)/layout.tsx — no need to repeat it.

export const metadata = { title: "Profile — Street Prep AI" };

export default async function ProfilePage() {
  // Auth — requireUser() is the gate; throws / redirects if unauthenticated.
  const user = await requireUser();

  // Load profile via Drizzle (RLS-scoped read through withUser).
  const profile = await withUser({ sub: user.id, role: "authenticated" }, (tx) =>
    getProfile(tx, user.id),
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-3">
        <div className="bg-accent mt-0.5 grid size-9 shrink-0 place-items-center rounded-md">
          <UserCircle className="text-accent-foreground size-4" aria-hidden />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-semibold">Profile</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Your background, targets, and bio — read by the chatbot, prep sheets, and story framer.
          </p>
        </div>
      </div>

      {/* Edit form (client component — needs hooks for RHF + toasts) */}
      <ProfileEditForm profile={profile} />
    </div>
  );
}

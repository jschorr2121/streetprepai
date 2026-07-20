import Link from "next/link";

import { PageHeader } from "@/components/page-header";
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
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="You"
        title="Profile"
        description="Your background, targets, and bio — read by the chatbot, prep sheets, and story framer."
      />

      {/* Edit form (client component — needs hooks for RHF + toasts) */}
      <div className="mt-8">
        <ProfileEditForm profile={profile} />
      </div>

      <div className="mt-6 border-t pt-6">
        <Link
          href="/profile/settings"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          Account settings
        </Link>
      </div>
    </div>
  );
}

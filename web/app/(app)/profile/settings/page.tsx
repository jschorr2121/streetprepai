import { PageHeader } from "@/components/page-header";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";
import { requireUser } from "@/lib/auth/server";

// Page is already force-dynamic via (app)/layout.tsx — no need to repeat it.

export const metadata = { title: "Account Settings — Street Prep AI" };

export default async function ProfileSettingsPage() {
  // Auth — requireUser() is the gate; throws / redirects if unauthenticated.
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your account. Some actions here are permanent."
      />

      <section className="border-destructive/40 mt-8 rounded-md border p-5">
        <h2 className="eyebrow text-destructive mb-2">Danger Zone</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Delete this account</p>
            <p className="text-muted-foreground text-sm">
              Permanently erase your profile, resume, mock interviews, stories, chats, and all
              learning progress. This cannot be undone.
            </p>
          </div>
          <DeleteAccountDialog />
        </div>
      </section>
    </div>
  );
}

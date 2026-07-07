import { redirect } from "next/navigation";

import { OnboardingForm } from "./onboarding-form";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getProfile } from "@/lib/db/queries/profile";

export const metadata = { title: "Get set up — Street Prep AI" };

// Single-page onboarding (4 fields). Middleware already gates access, but we
// re-check server-side: an onboarded user who lands here goes to the dashboard.
export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await withUser({ sub: user.id, role: "authenticated" }, (tx) =>
    getProfile(tx, user.id),
  );
  if (profile.onboardedAt) redirect("/dashboard");

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2">
          <p className="eyebrow">Getting set up</p>
          <h1 className="font-display text-2xl">Where are you in the cycle?</h1>
          <p className="text-muted-foreground text-sm">
            A few details so we can tailor your recruiting timeline and prep.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}

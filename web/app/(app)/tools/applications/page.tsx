import { Suspense } from "react";

import { ApplicationForm } from "@/app/(app)/tools/applications/_components/application-form";
import { ApplicationRow } from "@/app/(app)/tools/applications/_components/application-row";
import { StageFilter } from "@/app/(app)/tools/applications/_components/stage-filter";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { getApplications } from "@/lib/db/queries/applications";
import type { AppliedJobStage } from "@/lib/types";
import { APPLIED_JOB_STAGES } from "@/lib/validation/schemas/applied-jobs";

export const metadata = { title: "Applications — Street Prep AI" };

type Props = {
  searchParams: Promise<{ stage?: string }>;
};

export default async function ApplicationsPage({ searchParams }: Props) {
  const user = await requireUser();
  const { stage: rawStage } = await searchParams;

  // Validate the stage from the URL — reject unknown values silently.
  const stage =
    rawStage && (APPLIED_JOB_STAGES as readonly string[]).includes(rawStage)
      ? (rawStage as AppliedJobStage)
      : undefined;

  const applications = await withUser({ sub: user.id, role: "authenticated" }, (tx) =>
    getApplications(tx, user.id, stage ? { stage } : {}),
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="Tool · Tracker"
        title="Applications"
        description="Every job you're applying to — firm, role, stage, deadline, and notes — in one ledger."
      />

      {/* Add application form */}
      <section className="bg-card border-border mt-8 mb-8 rounded-md border p-5">
        <h2 className="eyebrow mb-4">Add application</h2>
        <ApplicationForm />
      </section>

      {/* Stage filter + list */}
      <section>
        <div className="mb-4">
          {/* StageFilter uses useSearchParams — needs Suspense when inside a server component. */}
          <Suspense fallback={<div className="h-6 w-full" />}>
            <StageFilter />
          </Suspense>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-md border border-dashed px-6 py-14 text-center">
            <p className="eyebrow">Empty</p>
            <p className="text-foreground mt-2 text-sm font-medium">
              {stage ? `No ${stage} applications yet.` : "No applications yet."}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {stage
                ? "Try a different stage filter or add a new application above."
                : "Add your first application using the form above."}
            </p>
          </div>
        ) : (
          <ul className="bg-card divide-y rounded-md border" aria-label="Your applications">
            {applications.map((app) => (
              <li key={app.id}>
                <ApplicationRow application={app} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

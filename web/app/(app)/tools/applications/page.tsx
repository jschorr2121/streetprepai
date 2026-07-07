import { Briefcase, PlusCircle } from "lucide-react";
import { Suspense } from "react";

import { ApplicationForm } from "@/app/(app)/tools/applications/_components/application-form";
import { ApplicationRow } from "@/app/(app)/tools/applications/_components/application-row";
import { StageFilter } from "@/app/(app)/tools/applications/_components/stage-filter";
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
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-3">
        <div className="bg-accent mt-0.5 grid size-9 shrink-0 place-items-center rounded-md">
          <Briefcase className="text-accent-foreground size-4" aria-hidden />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-semibold">Applications</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Track every job you&apos;re applying to — firm, role, stage, deadline, and notes.
          </p>
        </div>
      </div>

      {/* Add application form */}
      <section className="bg-card border-border mb-8 rounded-xl border p-5">
        <div className="mb-4 flex items-center gap-2">
          <PlusCircle className="text-primary size-4" aria-hidden />
          <h2 className="text-foreground text-sm font-semibold">Add application</h2>
        </div>
        {/* StageFilter uses useSearchParams — needs Suspense when inside a server component. */}
        <ApplicationForm />
      </section>

      {/* Stage filter + list */}
      <section>
        <div className="mb-4">
          <Suspense fallback={<div className="h-6 w-full" />}>
            <StageFilter />
          </Suspense>
        </div>

        {applications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="bg-accent mx-auto mb-3 grid size-12 place-items-center rounded-md">
              <Briefcase className="text-accent-foreground size-5" aria-hidden />
            </div>
            <p className="text-foreground text-sm font-semibold">
              {stage ? `No ${stage} applications yet.` : "No applications yet."}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {stage
                ? "Try a different stage filter or add a new application above."
                : "Add your first application using the form above."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Your applications">
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

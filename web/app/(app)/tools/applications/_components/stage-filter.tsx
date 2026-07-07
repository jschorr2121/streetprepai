"use client";

/**
 * Stage filter chips driven by URL state (searchParams + Next.js Link).
 * Selecting a chip sets `?stage=<value>`; clicking the active chip or "All"
 * clears the filter. No local useState — deep-linkable by design.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { APPLIED_JOB_STAGES } from "@/lib/validation/schemas/applied-jobs";

const STAGE_LABELS: Record<(typeof APPLIED_JOB_STAGES)[number], string> = {
  shortlist: "Shortlist",
  applied: "Applied",
  interview: "Interview",
  superday: "Superday",
  offer: "Offer",
  rejected: "Rejected",
};

export function StageFilter() {
  const searchParams = useSearchParams();
  const activeStage = searchParams.get("stage");

  function buildHref(stage: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (stage) {
      params.set("stage", stage);
    } else {
      params.delete("stage");
    }
    const qs = params.toString();
    return `/tools/applications${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by stage">
      {/* "All" chip */}
      <Link
        href={buildHref(null)}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          !activeStage
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
        )}
        aria-current={!activeStage ? "page" : undefined}
      >
        All
      </Link>

      {APPLIED_JOB_STAGES.map((stage) => {
        const isActive = activeStage === stage;
        return (
          <Link
            key={stage}
            href={buildHref(stage)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {STAGE_LABELS[stage]}
          </Link>
        );
      })}
    </div>
  );
}

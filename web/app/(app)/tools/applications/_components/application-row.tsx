"use client";

/**
 * A single application row. Supports:
 *   - Inline stage edit via a <select> that fires `updateApplicationAction`.
 *   - Delete button that fires `deleteApplicationAction` with optimistic feedback.
 */

import { ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  deleteApplicationAction,
  updateApplicationAction,
} from "@/app/(app)/tools/applications/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AppliedJob, AppliedJobStage } from "@/lib/types";
import { APPLIED_JOB_STAGES } from "@/lib/validation/schemas/applied-jobs";

const STAGE_LABELS: Record<AppliedJobStage, string> = {
  shortlist: "Shortlist",
  applied: "Applied",
  interview: "Interview",
  superday: "Superday",
  offer: "Offer",
  rejected: "Rejected",
};

// Ledger tag per stage — semantic Badge variants, no decorative color.
const STAGE_BADGE: Record<
  AppliedJobStage,
  "outline" | "secondary" | "default" | "warning" | "success" | "destructive"
> = {
  shortlist: "outline",
  applied: "secondary",
  interview: "default",
  superday: "warning",
  offer: "success",
  rejected: "destructive",
};

type Props = {
  application: AppliedJob;
};

export function ApplicationRow({ application }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleStageChange(newStage: AppliedJobStage) {
    startTransition(async () => {
      const result = await updateApplicationAction({ id: application.id, stage: newStage });
      if (!result.ok) {
        toast.error(result.error.message ?? "Failed to update stage.");
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete() {
    // Deletion is permanent and the trash icon is easy to mis-tap on mobile.
    if (!window.confirm(`Delete the ${application.firm} application? This can't be undone.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteApplicationAction({ id: application.id });
      if (!result.ok) {
        toast.error(result.error.message ?? "Failed to delete application.");
        return;
      }
      toast.success("Application deleted.");
      router.refresh();
    });
  }

  return (
    <div
      className="hover:bg-accent/30 flex items-start gap-4 p-4 transition-colors duration-150"
      data-testid="application-row"
      data-application-id={application.id}
    >
      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-foreground font-medium">{application.firm}</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-foreground text-sm">{application.role}</span>
          {application.group && (
            <span className="text-muted-foreground text-xs">({application.group})</span>
          )}
          <Badge variant={STAGE_BADGE[application.stage]}>{STAGE_LABELS[application.stage]}</Badge>
        </div>

        {/* Metadata row */}
        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px]">
          {application.deadline && (
            <span>due {new Date(application.deadline).toLocaleDateString()}</span>
          )}
          {application.url && (
            <a
              href={application.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground inline-flex items-center gap-0.5 underline underline-offset-2"
            >
              job link
              <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
          {application.addedAt && (
            <span>added {new Date(application.addedAt).toLocaleDateString()}</span>
          )}
        </div>

        {application.notes && (
          <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">{application.notes}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Inline stage edit */}
        <select
          aria-label="Stage"
          value={application.stage}
          disabled={isPending}
          onChange={(e) => handleStageChange(e.target.value as AppliedJobStage)}
          className="border-input bg-card text-foreground focus-visible:ring-ring h-7 rounded-sm border px-2 py-0.5 text-xs focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
        >
          {APPLIED_JOB_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete application"
          disabled={isPending}
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive size-7"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

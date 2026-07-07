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

// Colour tokens per stage (border-l accent only).
const STAGE_ACCENT: Record<AppliedJobStage, string> = {
  shortlist: "border-l-border",
  applied: "border-l-primary/40",
  interview: "border-l-primary",
  superday: "border-l-primary",
  offer: "border-l-primary",
  rejected: "border-l-destructive/40",
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
      className={`bg-card border-border hover:border-primary/20 flex items-start gap-4 rounded-lg border border-l-4 p-4 transition-colors ${STAGE_ACCENT[application.stage]}`}
      data-testid="application-row"
      data-application-id={application.id}
    >
      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-foreground font-semibold">{application.firm}</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-foreground text-sm">{application.role}</span>
          {application.group && (
            <span className="text-muted-foreground text-xs">({application.group})</span>
          )}
        </div>

        {/* Metadata row */}
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          {application.deadline && (
            <span>Deadline: {new Date(application.deadline).toLocaleDateString()}</span>
          )}
          {application.url && (
            <a
              href={application.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground inline-flex items-center gap-0.5 underline underline-offset-2"
            >
              Job link
              <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
          {application.addedAt && (
            <span>Added: {new Date(application.addedAt).toLocaleDateString()}</span>
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
          className="border-input bg-background text-foreground focus-visible:ring-ring h-7 rounded-md border px-2 py-0.5 text-xs shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
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

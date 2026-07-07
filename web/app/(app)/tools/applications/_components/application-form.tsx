"use client";

/**
 * Form to create a new application. Uses react-hook-form + Zod resolver
 * (matching the profile form pattern), submits via `createApplicationAction`.
 * On success the router is refreshed so the server component reloads the list.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createApplicationAction,
  createApplicationSchema,
  type CreateApplicationInput,
} from "@/app/(app)/tools/applications/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APPLIED_JOB_STAGES } from "@/lib/validation/schemas/applied-jobs";

const STAGE_LABELS: Record<(typeof APPLIED_JOB_STAGES)[number], string> = {
  shortlist: "Shortlist",
  applied: "Applied",
  interview: "Interview",
  superday: "Superday",
  offer: "Offer",
  rejected: "Rejected",
};

type Props = {
  onSuccess?: () => void;
};

export function ApplicationForm({ onSuccess }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      firm: "",
      role: "",
      group: "",
      stage: "applied",
      url: "",
      deadline: "",
      notes: "",
    },
  });

  const isLoading = isSubmitting || isPending;

  function onSubmit(data: CreateApplicationInput) {
    startTransition(async () => {
      const result = await createApplicationAction(data);
      if (!result.ok) {
        toast.error(result.error.message ?? "Failed to add application.");
        return;
      }
      toast.success("Application added.");
      reset();
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Firm */}
        <div className="space-y-1.5">
          <Label htmlFor="firm">
            Firm <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firm"
            placeholder="Goldman Sachs"
            aria-invalid={!!errors.firm}
            {...register("firm")}
          />
          {errors.firm && <p className="text-destructive text-xs">{errors.firm.message}</p>}
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <Label htmlFor="role">
            Role <span className="text-destructive">*</span>
          </Label>
          <Input
            id="role"
            placeholder="Summer Analyst"
            aria-invalid={!!errors.role}
            {...register("role")}
          />
          {errors.role && <p className="text-destructive text-xs">{errors.role.message}</p>}
        </div>

        {/* Group */}
        <div className="space-y-1.5">
          <Label htmlFor="group">Group</Label>
          <Input id="group" placeholder="M&A, LevFin, TMT…" {...register("group")} />
        </div>

        {/* Stage */}
        <div className="space-y-1.5">
          <Label htmlFor="stage">
            Stage <span className="text-destructive">*</span>
          </Label>
          <select
            id="stage"
            className="border-input bg-background text-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
            aria-invalid={!!errors.stage}
            {...register("stage")}
          >
            {APPLIED_JOB_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          {errors.stage && <p className="text-destructive text-xs">{errors.stage.message}</p>}
        </div>

        {/* URL */}
        <div className="space-y-1.5">
          <Label htmlFor="url">Job URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://careers.gs.com/…"
            aria-invalid={!!errors.url}
            {...register("url")}
          />
          {errors.url && <p className="text-destructive text-xs">{errors.url.message}</p>}
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" {...register("deadline")} />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Recruiter contact, referral name, interview prep notes…"
          rows={3}
          aria-invalid={!!errors.notes}
          {...register("notes")}
        />
        {errors.notes && <p className="text-destructive text-xs">{errors.notes.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading} size="sm">
        {isLoading ? "Adding…" : "Add application"}
      </Button>
    </form>
  );
}

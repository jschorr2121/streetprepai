"use client";

/**
 * Form to add a contact manually. react-hook-form + Zod resolver (same pattern
 * as the application tracker form); submits via `createContactAction` and
 * navigates to the new contact's detail page on success.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createContactAction } from "@/app/(app)/tools/relationships/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContactStage } from "@/lib/types";
import {
  CONTACT_STAGES,
  CreateContactSchema,
  type CreateContactFormInput,
} from "@/lib/validation/schemas/relationships";

const STAGE_LABELS: Record<ContactStage, string> = {
  cold: "Cold",
  "outreach-sent": "Outreach sent",
  "coffee-chat": "Coffee chat",
  warm: "Warm",
  interviewed: "Interviewed",
  offer: "Offer",
};

export function NewContactForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateContactFormInput>({
    resolver: zodResolver(CreateContactSchema),
    defaultValues: {
      name: "",
      firm: "",
      title: "",
      group: "",
      school: "",
      gradYear: "",
      howMet: "",
      stage: "cold",
      linkedinBio: "",
    },
  });

  const isLoading = isSubmitting || isPending;

  function onSubmit(data: CreateContactFormInput) {
    startTransition(async () => {
      const result = await createContactAction(data);
      if (!result.ok) {
        toast.error(result.error.message ?? "Failed to add contact.");
        return;
      }
      toast.success(`${result.data.name} added.`);
      router.push(`/tools/relationships/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Alex Chen"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

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

        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="Investment Banking Analyst" {...register("title")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="group">Group</Label>
          <Input id="group" placeholder="TMT, M&A, LevFin…" {...register("group")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="school">School</Label>
          <Input id="school" placeholder="Stanford" {...register("school")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gradYear">Grad year</Label>
          <Input
            id="gradYear"
            inputMode="numeric"
            placeholder="2023"
            aria-invalid={!!errors.gradYear}
            {...register("gradYear")}
          />
          {errors.gradYear && (
            <p className="text-destructive text-xs">{errors.gradYear.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="howMet">How you met</Label>
          <Input id="howMet" placeholder="Alumni mixer, October" {...register("howMet")} />
        </div>

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
            {CONTACT_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          {errors.stage && <p className="text-destructive text-xs">{errors.stage.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkedinBio">LinkedIn bio</Label>
        <Textarea
          id="linkedinBio"
          placeholder="Paste their LinkedIn about/experience text — the AI prep sheet uses it for hooks and talking points."
          rows={4}
          aria-invalid={!!errors.linkedinBio}
          {...register("linkedinBio")}
        />
        {errors.linkedinBio && (
          <p className="text-destructive text-xs">{errors.linkedinBio.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} size="sm">
        {isLoading ? "Adding…" : "Add contact"}
      </Button>
    </form>
  );
}

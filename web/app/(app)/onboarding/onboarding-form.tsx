"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { completeOnboardingAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GRAD_YEAR_RANGE,
  onboardingSchema,
  SEMESTERS,
  type OnboardingInput,
} from "@/lib/schemas/auth";

const SUGGESTED_FIRMS = [
  "Goldman Sachs",
  "Morgan Stanley",
  "JPMorgan",
  "Evercore",
  "Centerview",
  "Moelis",
];

export function OnboardingForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [firmDraft, setFirmDraft] = useState("");
  const {
    register,
    handleSubmit,
    control,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      school: "",
      // graduationYear is intentionally undefined until the user types — the
      // resolver surfaces "required" if left empty.
      graduationYear: undefined as unknown as number,
      currentSemester: undefined as unknown as OnboardingInput["currentSemester"],
      targetFirms: [],
      advancedTrack: false,
    },
  });

  const firms = watch("targetFirms");
  const advancedTrack = watch("advancedTrack");

  function addFirm(raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (firms.includes(value)) {
      setFirmDraft("");
      return;
    }
    setValue("targetFirms", [...firms, value], { shouldValidate: true });
    setFirmDraft("");
  }

  function removeFirm(value: string) {
    setValue(
      "targetFirms",
      firms.filter((f) => f !== value),
      { shouldValidate: true },
    );
  }

  function onFirmKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFirm(firmDraft);
    } else if (e.key === "Backspace" && !firmDraft && firms.length > 0) {
      removeFirm(firms[firms.length - 1]!);
    }
  }

  async function onSubmit(values: OnboardingInput) {
    setFormError(null);
    const result = await completeOnboardingAction(values);
    if (result.ok) {
      // Hard navigation, not router.push()+refresh(). The proxy gates /dashboard
      // on `onboarded_at`; a full request re-evaluates it with the freshly
      // onboarded session and loads the app shell clean. The prior
      // push()+refresh() raced — refresh() re-asserted the current route
      // (/onboarding) and discarded the push, stranding the user on onboarding
      // despite a successful write.
      window.location.assign("/dashboard");
      return;
    }
    if (result.error.fieldErrors) {
      for (const [field, message] of Object.entries(result.error.fieldErrors)) {
        setError(field as keyof OnboardingInput, { message });
      }
    }
    setFormError(result.error.message);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-border bg-card space-y-5 rounded-md border p-6"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="school">School</Label>
        <Input
          id="school"
          placeholder="e.g. University of Michigan"
          aria-invalid={Boolean(errors.school)}
          aria-describedby={errors.school ? "school-error" : undefined}
          {...register("school")}
        />
        {errors.school ? (
          <p id="school-error" className="text-destructive text-sm">
            {errors.school.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="graduationYear">Graduation year</Label>
          <Input
            id="graduationYear"
            type="number"
            inputMode="numeric"
            min={GRAD_YEAR_RANGE.min}
            max={GRAD_YEAR_RANGE.max}
            placeholder={String(GRAD_YEAR_RANGE.min + 2)}
            aria-invalid={Boolean(errors.graduationYear)}
            aria-describedby={errors.graduationYear ? "graduationYear-error" : undefined}
            {...register("graduationYear", { valueAsNumber: true })}
          />
          {errors.graduationYear ? (
            <p id="graduationYear-error" className="text-destructive text-sm">
              {errors.graduationYear.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currentSemester">Current semester</Label>
          <Controller
            control={control}
            name="currentSemester"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="currentSemester"
                  className="w-full"
                  aria-invalid={Boolean(errors.currentSemester)}
                  aria-describedby={errors.currentSemester ? "currentSemester-error" : undefined}
                >
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.currentSemester ? (
            <p id="currentSemester-error" className="text-destructive text-sm">
              {errors.currentSemester.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="targetFirms">Target firms</Label>
        {firms.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {firms.map((firm) => (
              <li key={firm}>
                <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-sm py-1 pr-1 pl-2.5 text-sm">
                  {firm}
                  <button
                    type="button"
                    onClick={() => removeFirm(firm)}
                    className="hover:bg-foreground/10 grid size-5 place-items-center rounded-sm"
                    aria-label={`Remove ${firm}`}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <Input
          id="targetFirms"
          value={firmDraft}
          onChange={(e) => setFirmDraft(e.target.value)}
          onKeyDown={onFirmKeyDown}
          onBlur={() => addFirm(firmDraft)}
          placeholder="Type a firm and press Enter"
          aria-invalid={Boolean(errors.targetFirms)}
          aria-describedby={errors.targetFirms ? "targetFirms-error" : undefined}
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {SUGGESTED_FIRMS.filter((s) => !firms.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addFirm(s)}
              className="border-border text-muted-foreground hover:border-primary/40 hover:text-foreground rounded-sm border px-2.5 py-1 text-xs transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
        {errors.targetFirms ? (
          <p id="targetFirms-error" className="text-destructive text-sm">
            {errors.targetFirms.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label>Study Preferences</Label>
        <button
          type="button"
          role="switch"
          aria-checked={advancedTrack}
          onClick={() => setValue("advancedTrack", !advancedTrack)}
          className="border-border hover:border-primary/40 flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors"
        >
          <span
            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${
              advancedTrack ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {advancedTrack ? "✓" : ""}
          </span>
          <span>
            <span className="text-sm font-medium">Advanced track</span>
            <span className="text-muted-foreground block text-xs">
              Show ⭐ elective sections and harder questions (deferred taxes, leases, waterfalls,
              338(h)(10)…). For PE-track or prior-experience candidates.
            </span>
          </span>
        </button>
      </div>

      {formError ? (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Finish setup"}
      </Button>
    </form>
  );
}

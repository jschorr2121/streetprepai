"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  saveProfileAction,
  saveProfileSchema,
  type SaveProfileInput,
} from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/types";

const SUGGESTED_FIRMS = [
  "Goldman Sachs",
  "Morgan Stanley",
  "JPMorgan",
  "Bank of America",
  "Evercore",
  "Centerview",
  "Moelis",
  "PJT Partners",
];

const SUGGESTED_ROLES = ["Summer Analyst", "Full-Time Analyst", "Associate"];

type Props = {
  profile: Profile;
};

export function ProfileEditForm({ profile }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [firmDraft, setFirmDraft] = useState("");
  const [roleDraft, setRoleDraft] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SaveProfileInput>({
    resolver: zodResolver(saveProfileSchema),
    defaultValues: {
      fullName: profile.fullName ?? "",
      school: profile.school ?? "",
      graduationYear: profile.graduationYear,
      targetRoles: profile.targetRoles ?? [],
      targetFirms: profile.targetFirms ?? [],
      bioSummary: profile.bioSummary ?? "",
      skills: profile.skills ?? [],
    },
  });

  const firms = watch("targetFirms") ?? [];
  const roles = watch("targetRoles") ?? [];

  // ─── Firm chip helpers ────────────────────────────────────────────────────
  function addFirm(raw: string) {
    const value = raw.trim();
    if (!value || firms.includes(value)) {
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

  // ─── Role chip helpers ────────────────────────────────────────────────────
  function addRole(raw: string) {
    const value = raw.trim();
    if (!value || roles.includes(value)) {
      setRoleDraft("");
      return;
    }
    setValue("targetRoles", [...roles, value], { shouldValidate: true });
    setRoleDraft("");
  }

  function removeRole(value: string) {
    setValue(
      "targetRoles",
      roles.filter((r) => r !== value),
      { shouldValidate: true },
    );
  }

  function onRoleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRole(roleDraft);
    } else if (e.key === "Backspace" && !roleDraft && roles.length > 0) {
      removeRole(roles[roles.length - 1]!);
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function onSubmit(values: SaveProfileInput) {
    startTransition(async () => {
      const result = await saveProfileAction(values);

      if (result.ok) {
        toast.success("Profile saved.");
        router.refresh();
        return;
      }

      if (result.error.code === "UNAUTHORIZED") {
        router.push("/login?next=/profile");
        return;
      }

      if (result.error.code === "RATE_LIMITED") {
        toast.error(result.error.message);
        return;
      }

      if (result.error.fieldErrors) {
        for (const [field, message] of Object.entries(result.error.fieldErrors)) {
          setError(field as keyof SaveProfileInput, { message });
        }
      }

      toast.error(result.error.message);
    });
  }

  const busy = isSubmitting || isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* ── Basics ──────────────────────────────────────────────────────── */}
      <section className="bg-card rounded-md border p-5">
        <h2 className="eyebrow mb-4">Basics</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Jake Schorr"
              aria-invalid={Boolean(errors.fullName)}
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className="text-destructive text-sm">{errors.fullName.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                placeholder="University of Michigan"
                aria-invalid={Boolean(errors.school)}
                {...register("school")}
              />
              {errors.school ? (
                <p className="text-destructive text-sm">{errors.school.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="graduationYear">Graduation year</Label>
              <Input
                id="graduationYear"
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                placeholder={String(new Date().getFullYear() + 2)}
                aria-invalid={Boolean(errors.graduationYear)}
                {...register("graduationYear", { valueAsNumber: true })}
              />
              {errors.graduationYear ? (
                <p className="text-destructive text-sm">{errors.graduationYear.message}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bio & Background ─────────────────────────────────────────────── */}
      <section className="bg-card rounded-md border p-5">
        <h2 className="eyebrow mb-4">Bio &amp; Background</h2>
        <div className="space-y-1.5">
          <Label htmlFor="bioSummary">Short bio</Label>
          <Textarea
            id="bioSummary"
            rows={4}
            placeholder="Sophomore at Michigan studying Finance. Targeting BB/EB SA roles for Summer 2027…"
            className="resize-none"
            aria-invalid={Boolean(errors.bioSummary)}
            {...register("bioSummary")}
          />
          {errors.bioSummary ? (
            <p className="text-destructive text-sm">{errors.bioSummary.message}</p>
          ) : null}
        </div>
      </section>

      {/* ── Recruiting targets ───────────────────────────────────────────── */}
      <section className="bg-card rounded-md border p-5">
        <h2 className="eyebrow mb-4">Recruiting Targets</h2>

        <div className="space-y-4">
          {/* Target firms */}
          <div className="space-y-1.5">
            <Label htmlFor="targetFirms">Target firms</Label>
            {firms.length > 0 ? (
              <ul className="mb-1.5 flex flex-wrap gap-1.5">
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
              <p className="text-destructive text-sm">{errors.targetFirms.message}</p>
            ) : null}
          </div>

          {/* Target roles */}
          <div className="space-y-1.5">
            <Label htmlFor="targetRoles">Target roles</Label>
            {roles.length > 0 ? (
              <ul className="mb-1.5 flex flex-wrap gap-1.5">
                {roles.map((role) => (
                  <li key={role}>
                    <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-sm py-1 pr-1 pl-2.5 text-sm">
                      {role}
                      <button
                        type="button"
                        onClick={() => removeRole(role)}
                        className="hover:bg-foreground/10 grid size-5 place-items-center rounded-sm"
                        aria-label={`Remove ${role}`}
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Input
              id="targetRoles"
              value={roleDraft}
              onChange={(e) => setRoleDraft(e.target.value)}
              onKeyDown={onRoleKeyDown}
              onBlur={() => addRole(roleDraft)}
              placeholder="Type a role and press Enter"
              aria-invalid={Boolean(errors.targetRoles)}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTED_ROLES.filter((s) => !roles.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addRole(s)}
                  className="border-border text-muted-foreground hover:border-primary/40 hover:text-foreground rounded-sm border px-2.5 py-1 text-xs transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
            {errors.targetRoles ? (
              <p className="text-destructive text-sm">{errors.targetRoles.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button type="submit" disabled={busy} className="min-w-32">
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

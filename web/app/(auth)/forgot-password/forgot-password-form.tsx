"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { requestPasswordResetAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetSchema, type RequestPasswordResetInput } from "@/lib/schemas/auth";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RequestPasswordResetInput) {
    setFormError(null);
    const result = await requestPasswordResetAction(values);
    if (result.ok) {
      setSent(true);
      return;
    }
    if (result.error.fieldErrors?.email) {
      setError("email", { message: result.error.fieldErrors.email });
    }
    setFormError(result.error.message);
  }

  if (sent) {
    return (
      <div className="border-border bg-card space-y-3 rounded-lg border p-6 text-center">
        <div className="bg-accent mx-auto grid size-12 place-items-center rounded-md">
          <MailCheck className="text-accent-foreground size-5" aria-hidden />
        </div>
        <h2 className="text-foreground text-lg font-semibold">Check your email</h2>
        <p className="text-muted-foreground text-sm">
          If an account exists for that address, a reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
      </div>

      {formError ? (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

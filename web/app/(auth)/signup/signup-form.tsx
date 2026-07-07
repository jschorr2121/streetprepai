"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { signUpAction } from "./actions";
import { AuthDivider } from "@/components/auth/divider";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpSchema, type SignUpInput } from "@/lib/schemas/auth";

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignUpInput) {
    setFormError(null);
    const result = await signUpAction(values);
    if (result.ok) {
      // Email confirmation disabled in dev → session is live → go onboard.
      // If enabled later, no session comes back → show the check-email state.
      if (result.data.needsEmailConfirmation) {
        setCheckEmail(true);
        return;
      }
      router.push("/onboarding");
      router.refresh();
      return;
    }
    if (result.error.fieldErrors) {
      for (const [field, message] of Object.entries(result.error.fieldErrors)) {
        setError(field as keyof SignUpInput, { message });
      }
    }
    setFormError(result.error.message);
  }

  if (checkEmail) {
    return (
      <div className="border-border bg-card space-y-3 rounded-lg border p-6 text-center">
        <div className="bg-accent mx-auto grid size-12 place-items-center rounded-md">
          <MailCheck className="text-accent-foreground size-5" aria-hidden />
        </div>
        <h2 className="text-foreground text-lg font-semibold">Check your email</h2>
        <p className="text-muted-foreground text-sm">
          We sent a confirmation link. Click it to finish setting up your account, then sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-destructive text-sm">{errors.password.message}</p>
          ) : (
            <p className="text-muted-foreground text-xs">At least 8 characters.</p>
          )}
        </div>

        {formError ? (
          <p className="text-destructive text-sm" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <AuthDivider />
      <GoogleButton label="Sign up with Google" />
    </div>
  );
}

import Link from "next/link";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Reset password — Street Prep AI" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-muted-foreground text-sm">
          We&apos;ll email you a link to set a new one.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

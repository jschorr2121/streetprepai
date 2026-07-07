import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Set a new password — Street Prep AI" };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="text-muted-foreground text-sm">
          Choose a password you don&apos;t use elsewhere.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}

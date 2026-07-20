import Link from "next/link";

import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up — Street Prep AI" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl">Create your account</h1>
        <p className="text-muted-foreground text-sm">Start prepping for IB recruiting.</p>
      </div>
      <SignupForm />
      <p className="text-muted-foreground text-xs">
        By signing up you agree to the{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="text-muted-foreground border-t pt-4 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

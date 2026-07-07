import Link from "next/link";

import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up — Street Prep AI" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-muted-foreground text-sm">Start prepping for IB recruiting.</p>
      </div>
      <SignupForm />
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

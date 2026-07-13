import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Street Prep AI" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to continue your prep.</p>
      </div>
      <LoginForm />
      <p className="text-muted-foreground border-t pt-4 text-sm">
        New here?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

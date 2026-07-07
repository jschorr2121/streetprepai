import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Street Prep AI" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to continue your prep.</p>
      </div>
      <LoginForm />
      <p className="text-muted-foreground text-center text-sm">
        New here?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

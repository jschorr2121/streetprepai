import Link from "next/link";
import { Sparkles } from "lucide-react";

// Bare auth layout — no app sidebar. Centered card on the warm off-white
// background, brand mark at top. Used by login / signup / password reset.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-semibold tracking-tight"
        aria-label="Street Prep AI home"
      >
        <div className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-md">
          <Sparkles className="size-4" aria-hidden />
        </div>
        <div className="leading-tight">
          <span className="text-base">Street Prep</span>
          <span className="text-primary ml-1 text-sm font-semibold">AI</span>
        </div>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

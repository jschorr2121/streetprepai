import Link from "next/link";

// Bare auth layout — no app sidebar. Centered card on paper, typographic
// wordmark above. Used by login / signup / password reset.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-baseline gap-1.5" aria-label="Street Prep AI home">
        <span className="font-display text-xl leading-none">Street Prep</span>
        <span className="text-primary font-mono text-[11px] font-medium tracking-[0.14em]">AI</span>
      </Link>
      <div className="bg-card w-full max-w-sm rounded-md border p-6">{children}</div>
    </div>
  );
}

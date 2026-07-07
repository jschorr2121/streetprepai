"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry's Next.js SDK captures via onRequestError on the server and
    // the client provider on the browser. This effect is a fallback for
    // boundaries it can't reach automatically.
    if (typeof window !== "undefined") {
      import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error)).catch(() => {});
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        <p className="eyebrow">Something broke</p>
        <h1 className="font-display text-2xl">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">
          We hit an unexpected error. The team has been notified.
          {error.digest ? (
            <span className="mt-2 block font-mono text-xs">ref: {error.digest}</span>
          ) : null}
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

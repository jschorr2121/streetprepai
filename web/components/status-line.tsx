import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps an AI-wait indicator (spinner + text) in a polite live region so
 * screen readers announce state changes — pending, streaming, done — instead
 * of staying silent in front of a spinning icon. Use for any "AI is working"
 * status text; skip a site that already sits inside a role="status" ancestor.
 */
export function StatusLine({ className, ...props }: ComponentProps<"div">) {
  return <div role="status" aria-live="polite" className={cn(className)} {...props} />;
}

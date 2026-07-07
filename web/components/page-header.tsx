import { cn } from "@/lib/utils";

/**
 * Standard page header: mono index eyebrow, serif display title, supporting
 * line, optional right-aligned action slot. Every top-level (app) page uses
 * this instead of hand-rolled headers.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b pb-6", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl">{title}</h1>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {description && <p className="text-muted-foreground mt-2 max-w-2xl text-sm">{description}</p>}
    </header>
  );
}

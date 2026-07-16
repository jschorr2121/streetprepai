import Link from "next/link";
import { getAllFirms } from "@/lib/data/firms";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Firms — Street Prep AI" };

export default async function FirmsPage() {
  const firms = await getAllFirms();
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="Reference"
        title="Firms, with live interview prep"
        description="Each firm page generates a custom pre-interview prep sheet from the latest earnings, deals, and culture notes — refreshed with your own past conversations there."
      />
      {firms.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed px-6 py-14 text-center">
          <p className="eyebrow">Empty</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Firm reference data hasn&apos;t been loaded yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {firms.map((f) => (
            <Link
              key={f.slug}
              href={`/firms/${f.slug}`}
              className="group bg-card hover:border-primary/50 rounded-md border p-5 transition-colors duration-150"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display group-hover:text-primary text-lg transition-colors">
                  {f.name}
                </p>
                <Badge variant="outline">{f.tier.replace("-", " ")}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 font-mono text-xs">{f.hq}</p>
              <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-relaxed">
                {f.description}
              </p>
              <p className="text-primary mt-4 flex items-center gap-1 font-mono text-xs">
                OPEN PREP SHEET
                <ArrowRight aria-hidden className="size-3" />
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

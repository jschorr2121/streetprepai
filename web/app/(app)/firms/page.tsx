import Link from "next/link";
import { seedFirms } from "@/lib/data/firms";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight } from "lucide-react";

export default function FirmsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <Building2 className="size-4" /> Firm guides
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Firms, with live interview prep
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Each firm page generates a custom pre-interview prep sheet from the
          latest earnings, deals, and culture notes — refreshed with your own
          past conversations there.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {seedFirms.map((f) => (
          <Link
            key={f.slug}
            href={`/firms/${f.slug}`}
            className="group rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="font-semibold group-hover:text-primary transition-colors">
                {f.name}
              </p>
              <Badge variant="outline" className="text-xs capitalize">
                {f.tier.replace("-", " ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{f.hq}</p>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {f.description}
            </p>
            <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
              Open prep sheet <ArrowRight className="size-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

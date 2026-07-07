import Link from "next/link";
import { Layers } from "lucide-react";

const SECTORS = [
  { slug: "tmt", label: "TMT" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "fig", label: "FIG" },
  { slug: "energy", label: "Energy" },
  { slug: "consumer-retail", label: "Consumer & Retail" },
  { slug: "industrials", label: "Industrials" },
  { slug: "real-estate", label: "Real Estate" },
  { slug: "financial-sponsors", label: "Financial Sponsors" },
];

export default function SectorsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-accent text-accent-foreground grid size-10 place-items-center rounded-md">
          <Layers className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sectors</h1>
          <p className="text-muted-foreground text-sm">
            Coverage area, recent deals, top firms, and key terminology per sector.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {SECTORS.map((s) => (
          <Link
            key={s.slug}
            href={`/sectors/${s.slug}`}
            className="bg-card hover:border-primary/30 rounded-lg border p-4 transition-colors"
          >
            <p className="font-semibold">{s.label}</p>
            <p className="text-muted-foreground mt-1 text-sm">Coming soon</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

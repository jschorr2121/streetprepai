import Link from "next/link";
import { PageHeader } from "@/components/page-header";

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
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="Reference"
        title="Sectors"
        description="Coverage area, recent deals, top firms, and key terminology per sector."
      />
      <ul className="mt-8">
        {SECTORS.map((s, i) => (
          <li key={s.slug}>
            <Link
              href={`/sectors/${s.slug}`}
              className="group hover:bg-accent/40 -mx-3 flex items-center justify-between gap-4 rounded-sm border-b px-3 py-3.5 transition-colors duration-150"
            >
              <span className="flex items-baseline gap-3">
                <span className="text-muted-foreground font-mono text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="group-hover:text-primary font-medium transition-colors">
                  {s.label}
                </span>
              </span>
              <span className="text-muted-foreground font-mono text-[11px] tracking-[0.08em] uppercase">
                Soon
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

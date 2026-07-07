import Link from "next/link";
import { getAllGuides, categoryLabels } from "@/lib/data/guides";
import { PageHeader } from "@/components/page-header";
import { ArrowRight } from "lucide-react";
import type { GuideCategory } from "@/lib/types";

const allCategories: GuideCategory[] = [
  "technicals",
  "behavioral",
  "firm-guides",
  "networking",
  "resume",
  "modeling",
  "superday",
  "market-news",
];

const placeholderCounts: Record<GuideCategory, number> = {
  technicals: 24,
  behavioral: 18,
  "firm-guides": 32,
  networking: 9,
  resume: 6,
  modeling: 12,
  superday: 7,
  "market-news": 15,
};

export default function LibraryPage() {
  const guides = getAllGuides();
  const byCategory = new Map<GuideCategory, typeof guides>();
  for (const g of guides) {
    const list = byCategory.get(g.category) ?? [];
    list.push(g);
    byCategory.set(g.category, list);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="The library"
        title="Everything you'll be asked in an IB interview"
        description="Guides built for how bankers actually interview. Every guide opens in the Reading Lens — highlight any passage for a plain-English explanation."
      />

      <div className="mt-10 space-y-12">
        {allCategories.map((cat, i) => {
          const list = byCategory.get(cat) ?? [];
          const hasContent = list.length > 0;
          return (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <div className="flex items-baseline justify-between gap-4 border-b pb-3">
                <h2 id={`cat-${cat}`} className="flex items-baseline gap-3">
                  <span className="text-muted-foreground font-mono text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-xl">{categoryLabels[cat]}</span>
                </h2>
                <p className="text-muted-foreground shrink-0 font-mono text-xs">
                  {hasContent
                    ? `${list.length} live · ${placeholderCounts[cat] - list.length}+ coming`
                    : `${placeholderCounts[cat]}+ coming`}
                </p>
              </div>
              {hasContent ? (
                <ul>
                  {list.map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/guide/${g.slug}`}
                        className="group hover:bg-accent/40 -mx-3 flex items-baseline justify-between gap-4 rounded-sm border-b px-3 py-3.5 transition-colors duration-150"
                      >
                        <span className="min-w-0">
                          <span className="group-hover:text-primary block font-medium transition-colors">
                            {g.title}
                          </span>
                          <span className="text-muted-foreground mt-0.5 line-clamp-1 block text-sm">
                            {g.description}
                          </span>
                        </span>
                        <span className="text-muted-foreground flex shrink-0 items-center gap-3 font-mono text-[11px] tracking-[0.08em] uppercase">
                          {g.difficulty} · {g.readingMinutes} min
                          <ArrowRight
                            aria-hidden
                            className="group-hover:text-primary size-3 transition-colors"
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground border-b border-dashed px-3 py-5 font-mono text-xs">
                  COMING SOON
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

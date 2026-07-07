import Link from "next/link";
import { getAllGuides, categoryLabels } from "@/lib/data/guides";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpenText } from "lucide-react";
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
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <header className="mb-8">
        <div className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
          <BookOpenText className="size-4" /> Content Library
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Everything you&apos;ll be asked in an IB interview
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Guides built for how bankers actually interview. Every guide opens in the Reading Lens —
          highlight any passage for a plain-English explanation from Claude.
        </p>
      </header>

      <div className="space-y-10">
        {allCategories.map((cat) => {
          const list = byCategory.get(cat) ?? [];
          const hasContent = list.length > 0;
          return (
            <section key={cat}>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{categoryLabels[cat]}</h2>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {hasContent
                      ? `${list.length} live · ${placeholderCounts[cat] - list.length}+ coming`
                      : `${placeholderCounts[cat]}+ guides coming`}
                  </p>
                </div>
              </div>
              {hasContent ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {list.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/guide/${g.slug}`}
                      className="group bg-card hover:border-primary/40 rounded-xl border p-4 transition-all hover:shadow-sm"
                    >
                      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
                        <span className="capitalize">{g.difficulty}</span>
                        <span>·</span>
                        <span>{g.readingMinutes} min</span>
                      </div>
                      <h3 className="group-hover:text-primary font-semibold transition-colors">
                        {g.title}
                      </h3>
                      <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs leading-relaxed">
                        {g.description}
                      </p>
                      <div className="text-primary mt-3 flex items-center gap-1 text-xs font-medium">
                        Open with lens <ArrowRight className="size-3" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
                  Coming soon · content gap in {categoryLabels[cat].toLowerCase()}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

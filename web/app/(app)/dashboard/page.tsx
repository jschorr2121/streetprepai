import Link from "next/link";
import { getAllGuides, categoryLabels } from "@/lib/data/guides";
import { seedContacts } from "@/lib/data/contacts";
import { requireUser } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, BookOpenText } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const meta = user.user_metadata as Record<string, unknown>;
  const fullName = typeof meta["full_name"] === "string" ? meta["full_name"] : undefined;
  const firstName = fullName?.split(" ")[0] ?? user.email?.split("@")[0] ?? "there";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const guides = getAllGuides().slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
      <header className="flex flex-col gap-3 border-b pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="font-display mt-2 text-3xl">Welcome back, {firstName}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/learn">
              <BookOpenText aria-hidden /> Library
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/guide/walk-me-through-a-dcf">
              Open flagship demo <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      {/* Ledger strip: one ruled row, three cells. */}
      <section
        aria-label="This week at a glance"
        className="bg-card mt-8 grid grid-cols-1 divide-y rounded-md border md:grid-cols-3 md:divide-x md:divide-y-0"
      >
        <div className="p-5">
          <p className="eyebrow">Study streak</p>
          <p className="mt-2 text-3xl">
            <span className="tabular">12</span>{" "}
            <span className="text-muted-foreground text-sm">days</span>
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">longest 21</p>
        </div>
        <div className="p-5">
          <p className="eyebrow">Focus this week</p>
          <ol className="mt-2 space-y-1 text-sm">
            <li className="flex gap-2">
              <span className="text-muted-foreground font-mono text-xs leading-5">01</span>
              DCF terminal value
            </li>
            <li className="flex gap-2">
              <span className="text-muted-foreground font-mono text-xs leading-5">02</span>
              Conflict stories
            </li>
            <li className="flex gap-2">
              <span className="text-muted-foreground font-mono text-xs leading-5">03</span>
              GS TMT firm fit
            </li>
          </ol>
        </div>
        <div className="p-5">
          <p className="eyebrow">Upcoming</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-baseline gap-2">
              <span className="text-muted-foreground w-8 shrink-0 font-mono text-xs">MON</span>
              Coffee chat — Priya, Evercore
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-muted-foreground w-8 shrink-0 font-mono text-xs">WED</span>
              First round — Morgan Stanley
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between border-b pb-3">
          <div>
            <h2 className="font-display text-xl">Continue reading</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Try the Reading Lens on a real guide.
            </p>
          </div>
          <Button asChild variant="link" size="sm">
            <Link href="/learn">See all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="group bg-card hover:border-primary/50 rounded-md border p-5 transition-colors duration-150"
            >
              <p className="eyebrow">
                {categoryLabels[g.category]} · {g.readingMinutes} min · {g.difficulty}
              </p>
              <h3 className="font-display group-hover:text-primary mt-2 text-lg transition-colors">
                {g.title}
              </h3>
              <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-relaxed">
                {g.description}
              </p>
              <p className="text-primary mt-4 flex items-center gap-1 font-mono text-xs">
                OPEN WITH LENS
                <ArrowRight aria-hidden className="size-3" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="gap-4 p-5 py-5">
          <h3 className="eyebrow">Recent relationships</h3>
          <ul>
            {seedContacts.slice(0, 3).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 border-b py-2.5 first:pt-0 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {c.title} · {c.firm}
                    {c.group ? ` · ${c.group}` : ""}
                  </p>
                </div>
                <Badge variant="outline">{c.stage.replace("-", " ")}</Badge>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/tools/relationships">Open Relationships</Link>
          </Button>
        </Card>

        <Card className="gap-4 p-5 py-5">
          <h3 className="eyebrow">Try a mock interview</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Voice-based practice. Whisper transcribes your answer and Claude scores content,
            structure, and delivery.
          </p>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/tools/mock-interview?mode=technical">Technical</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/tools/mock-interview?mode=behavioral">Behavioral</Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}

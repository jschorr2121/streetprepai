import Link from "next/link";
import { getAllGuides, categoryLabels } from "@/lib/data/guides";
import { seedContacts } from "@/lib/data/contacts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Flame,
  BookOpenText,
  Mic,
  HeartHandshake,
  TrendingDown,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const guides = getAllGuides();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Friday · April 18</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Welcome back, Jake</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/learn">
              <BookOpenText className="mr-1.5 size-4" /> Library
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/guide/walk-me-through-a-dcf">
              Open flagship demo <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="size-4 text-orange-500" />
            <p className="text-sm font-medium">Study streak</p>
          </div>
          <p className="text-3xl font-semibold">12 days</p>
          <p className="text-muted-foreground mt-1 text-xs">Longest: 21 days</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="text-primary size-4" />
            <p className="text-sm font-medium">Focus this week</p>
          </div>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>1. DCF terminal value</li>
            <li>2. Conflict stories</li>
            <li>3. GS TMT firm fit</li>
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="text-primary size-4" />
            <p className="text-sm font-medium">Upcoming</p>
          </div>
          <ul className="space-y-1 text-sm">
            <li>
              Mon · Coffee chat <span className="text-muted-foreground">Priya · Evercore</span>
            </li>
            <li>
              Wed · First round <span className="text-muted-foreground">Morgan Stanley</span>
            </li>
          </ul>
        </Card>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Continue reading</h2>
            <p className="text-muted-foreground text-sm">Try the Reading Lens on a real guide.</p>
          </div>
          <Button asChild variant="link" size="sm" className="text-primary">
            <Link href="/learn">See all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="group bg-card hover:border-primary/40 rounded-xl border p-5 transition-all hover:shadow-sm"
            >
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="rounded-full">
                  {categoryLabels[g.category]}
                </Badge>
                <span>·</span>
                <span>{g.readingMinutes} min read</span>
                <span>·</span>
                <span className="capitalize">{g.difficulty}</span>
              </div>
              <h3 className="group-hover:text-primary font-semibold transition-colors">
                {g.title}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {g.description}
              </p>
              <div className="text-primary mt-4 flex items-center gap-1 text-xs font-medium">
                Open with lens
                <ArrowRight className="size-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <HeartHandshake className="text-primary size-4" />
            <h3 className="font-semibold">Recent relationships</h3>
          </div>
          <ul className="space-y-3">
            {seedContacts.slice(0, 3).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {c.title} · {c.firm}
                    {c.group ? ` · ${c.group}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {c.stage.replace("-", " ")}
                </Badge>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link href="/tools/relationships">Open Relationships</Link>
          </Button>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Mic className="text-primary size-4" />
            <h3 className="font-semibold">Try a mock interview</h3>
          </div>
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
            Voice-based practice. Whisper transcribes your answer and Claude scores content,
            structure, and delivery.
          </p>
          <div className="grid grid-cols-2 gap-2">
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

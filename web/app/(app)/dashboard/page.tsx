import Link from "next/link";
import { getAllGuides, categoryLabels } from "@/lib/data/guides";
import { seedJobs } from "@/lib/data/jobs";
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
  Sparkles,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const guides = getAllGuides();
  const openDeadlines = [...seedJobs]
    .filter((j) => j.deadline)
    .sort((a, b) =>
      (a.deadline ?? "").localeCompare(b.deadline ?? ""),
    )
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Friday · April 18</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">
            Welcome back, Jake
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/library">
              <BookOpenText className="size-4 mr-1.5" /> Library
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/guide/walk-me-through-a-dcf">
              Open flagship demo <ArrowRight className="size-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="size-4 text-orange-500" />
            <p className="text-sm font-medium">Study streak</p>
          </div>
          <p className="text-3xl font-semibold">12 days</p>
          <p className="text-xs text-muted-foreground mt-1">
            Longest: 21 days
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="size-4 text-primary" />
            <p className="text-sm font-medium">Focus this week</p>
          </div>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>1. DCF terminal value</li>
            <li>2. Conflict stories</li>
            <li>3. GS TMT firm fit</li>
          </ul>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="size-4 text-primary" />
            <p className="text-sm font-medium">Upcoming</p>
          </div>
          <ul className="text-sm space-y-1">
            <li>
              Mon · Coffee chat{" "}
              <span className="text-muted-foreground">Priya · Evercore</span>
            </li>
            <li>
              Wed · First round{" "}
              <span className="text-muted-foreground">Morgan Stanley</span>
            </li>
          </ul>
        </Card>
      </section>

      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Continue reading
            </h2>
            <p className="text-sm text-muted-foreground">
              Try the Reading Lens on a real guide.
            </p>
          </div>
          <Button asChild variant="link" size="sm" className="text-primary">
            <Link href="/library">See all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="group rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="rounded-full">
                  {categoryLabels[g.category]}
                </Badge>
                <span>·</span>
                <span>{g.readingMinutes} min read</span>
                <span>·</span>
                <span className="capitalize">{g.difficulty}</span>
              </div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {g.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {g.description}
              </p>
              <div className="flex items-center gap-1 mt-4 text-xs text-primary font-medium">
                Open with lens
                <ArrowRight className="size-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <HeartHandshake className="size-4 text-primary" />
            <h3 className="font-semibold">Recent relationships</h3>
          </div>
          <ul className="space-y-3">
            {seedContacts.slice(0, 3).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 pb-3 last:pb-0 last:border-0 border-b"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
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
            <Link href="/relationships">Open Relationships</Link>
          </Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="size-4 text-primary" />
            <h3 className="font-semibold">Try a mock interview</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Voice-based practice. Whisper transcribes your answer and Claude
            scores content, structure, and delivery.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/interview?mode=technical">Technical</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/interview?mode=behavioral">Behavioral</Link>
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Closing soon
            </h2>
            <p className="text-sm text-muted-foreground">
              Applications with the nearest deadlines.
            </p>
          </div>
          <Button asChild variant="link" size="sm" className="text-primary">
            <Link href="/jobs">All jobs</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {openDeadlines.map((j) => (
            <div
              key={j.id}
              className="rounded-lg border bg-card p-4 flex flex-col gap-1"
            >
              <p className="text-sm font-semibold">{j.firm}</p>
              <p className="text-xs text-muted-foreground">{j.role}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {j.location} · Due {j.deadline}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

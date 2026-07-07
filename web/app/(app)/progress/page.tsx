import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingDown, BarChart3, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const weakAreas = [
  {
    topic: "DCF terminal value assumptions",
    subtopic: "Gordon Growth vs exit multiple",
    mastery: 0.38,
    signal: "2 recent mock questions scored below 60",
    drillHref: "/guide/walk-me-through-a-dcf",
  },
  {
    topic: "Conflict stories",
    subtopic: "STAR structure — Situation too long",
    mastery: 0.42,
    signal: "Only 1 conflict story in your Story Bank",
    drillHref: "/tools/story-framer",
  },
  {
    topic: "GS TMT firm-specific fit",
    subtopic: "Recent deal knowledge",
    mastery: 0.51,
    signal: "Haven't opened GS firm page this week",
    drillHref: "/firms/goldman-sachs",
  },
];

const masteryByTopic = [
  { topic: "Accounting", mastery: 0.82 },
  { topic: "Valuation", mastery: 0.67 },
  { topic: "M&A", mastery: 0.74 },
  { topic: "LBO", mastery: 0.55 },
  { topic: "Behavioral", mastery: 0.62 },
  { topic: "Firm-specific", mastery: 0.48 },
  { topic: "Networking", mastery: 0.77 },
  { topic: "Modeling tests", mastery: 0.3 },
];

const streakDays = Array.from({ length: 28 }, (_, i) => {
  const v = Math.random();
  return { day: i, active: v > 0.22 };
});

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <header className="mb-6">
        <div className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="size-4" /> Progress
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">What you need to work on</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Not what you&apos;ve done — what to do next. Mock scores, flashcard accuracy, and reading
          signals all feed this.
        </p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Flame className="size-4 text-orange-500" />
            <p className="text-sm font-medium">Streak</p>
          </div>
          <p className="text-3xl font-semibold">12 days</p>
          <p className="text-muted-foreground mt-1 text-xs">Longest: 21 days</p>
        </Card>
        <Card className="p-5">
          <p className="mb-2 text-sm font-medium">Overall mastery</p>
          <p className="text-3xl font-semibold">61%</p>
          <p className="text-muted-foreground mt-1 text-xs">+4% in the last 7 days</p>
        </Card>
        <Card className="p-5">
          <p className="mb-2 text-sm font-medium">This week</p>
          <p className="text-3xl font-semibold">23</p>
          <p className="text-muted-foreground mt-1 text-xs">flashcards · 2 mocks · 4 chats</p>
        </Card>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <TrendingDown className="text-primary size-4" /> Focus today
            </h2>
            <p className="text-muted-foreground text-sm">
              Ranked by how much they&apos;re holding you back.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {weakAreas.map((w, i) => (
            <Card key={w.topic} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="bg-accent grid size-6 place-items-center rounded-full text-xs font-semibold">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold">{w.topic}</p>
                  </div>
                  <p className="text-muted-foreground ml-8 text-xs">{w.subtopic}</p>
                  <p className="text-muted-foreground mt-1 ml-8 text-xs">{w.signal}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="w-20">
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div className="bg-primary h-full" style={{ width: `${w.mastery * 100}%` }} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-right text-[10px]">
                      {Math.round(w.mastery * 100)}% mastered
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={w.drillHref}>
                      Drill <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Mastery by topic</h2>
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {masteryByTopic.map((t) => (
              <div key={t.topic}>
                <p className="mb-1 text-xs font-medium">{t.topic}</p>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full transition-all",
                      t.mastery >= 0.7
                        ? "bg-primary"
                        : t.mastery >= 0.5
                          ? "bg-amber-500"
                          : "bg-rose-500",
                    )}
                    style={{ width: `${t.mastery * 100}%` }}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-[10px]">
                  {Math.round(t.mastery * 100)}%
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Last 4 weeks</h2>
        <Card className="p-5">
          <div className="grid grid-cols-14 gap-1">
            {streakDays.map((d) => (
              <div
                key={d.day}
                className={cn("aspect-square rounded-sm", d.active ? "bg-primary/80" : "bg-muted")}
              />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

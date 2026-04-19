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
    drillHref: "/story-framer",
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
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <BarChart3 className="size-4" /> Progress
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          What you need to work on
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Not what you've done — what to do next. Mock scores, flashcard
          accuracy, and reading signals all feed this.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="size-4 text-orange-500" />
            <p className="text-sm font-medium">Streak</p>
          </div>
          <p className="text-3xl font-semibold">12 days</p>
          <p className="text-xs text-muted-foreground mt-1">Longest: 21 days</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium mb-2">Overall mastery</p>
          <p className="text-3xl font-semibold">61%</p>
          <p className="text-xs text-muted-foreground mt-1">
            +4% in the last 7 days
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium mb-2">This week</p>
          <p className="text-3xl font-semibold">23</p>
          <p className="text-xs text-muted-foreground mt-1">
            flashcards · 2 mocks · 4 chats
          </p>
        </Card>
      </div>

      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <TrendingDown className="size-4 text-primary" /> Focus today
            </h2>
            <p className="text-sm text-muted-foreground">
              Ranked by how much they're holding you back.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {weakAreas.map((w, i) => (
            <Card key={w.topic} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="size-6 rounded-full bg-accent grid place-items-center text-xs font-semibold">
                      {i + 1}
                    </span>
                    <p className="font-semibold text-sm">{w.topic}</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-8">
                    {w.subtopic}
                  </p>
                  <p className="text-xs text-muted-foreground ml-8 mt-1">
                    {w.signal}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${w.mastery * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                      {Math.round(w.mastery * 100)}% mastered
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={w.drillHref}>
                      Drill <ArrowRight className="size-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Mastery by topic
        </h2>
        <Card className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {masteryByTopic.map((t) => (
              <div key={t.topic}>
                <p className="text-xs font-medium mb-1">{t.topic}</p>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
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
                <p className="text-[10px] text-muted-foreground mt-1">
                  {Math.round(t.mastery * 100)}%
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Last 4 weeks
        </h2>
        <Card className="p-5">
          <div className="grid grid-cols-14 gap-1">
            {streakDays.map((d) => (
              <div
                key={d.day}
                className={cn(
                  "aspect-square rounded-sm",
                  d.active ? "bg-primary/80" : "bg-muted",
                )}
              />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

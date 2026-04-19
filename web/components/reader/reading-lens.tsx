"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Markdown } from "@/components/reader/markdown";
import { ChatPanel } from "@/components/reader/chat-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Guide, Section } from "@/lib/types";
import {
  Sparkles,
  Highlighter,
  X,
  Loader2,
  MessageSquare,
  NotebookPen,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type LensExplanation = {
  id: string;
  sectionHeading?: string;
  selection: string;
  answer: string;
  streaming: boolean;
};

type BeginnerRewrite = { streaming: boolean; content: string };

export function ReadingLens({
  guide,
  sections,
}: {
  guide: Guide;
  sections: Section[];
}) {
  const [beginnerMode, setBeginnerMode] = useState(false);
  const [rewrites, setRewrites] = useState<Record<string, BeginnerRewrite>>({});
  const [explanations, setExplanations] = useState<LensExplanation[]>([]);
  const [popover, setPopover] = useState<{
    x: number;
    y: number;
    text: string;
    sectionHeading?: string;
  } | null>(null);
  const [rightTab, setRightTab] = useState<"lens" | "chat">("lens");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rightRailRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setPopover(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 4 || text.length > 1000) {
      setPopover(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!contentRef.current?.contains(range.commonAncestorContainer)) {
      setPopover(null);
      return;
    }
    const rect = range.getBoundingClientRect();

    let sectionHeading: string | undefined;
    let node: Node | null = range.commonAncestorContainer;
    while (node && !(node instanceof HTMLElement && node.dataset.sectionId)) {
      node = node.parentNode;
    }
    if (node instanceof HTMLElement) {
      sectionHeading = node.dataset.sectionHeading;
    }

    setPopover({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      text,
      sectionHeading,
    });
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  async function explainSelection() {
    if (!popover) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setExplanations((xs) => [
      ...xs,
      {
        id,
        selection: popover.text,
        sectionHeading: popover.sectionHeading,
        answer: "",
        streaming: true,
      },
    ]);
    setRightTab("lens");
    const popoverText = popover.text;
    const popoverHeading = popover.sectionHeading;
    setPopover(null);
    window.getSelection()?.removeAllRanges();

    requestAnimationFrame(() => {
      rightRailRef.current?.scrollTo({
        top: rightRailRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    try {
      const section = sections.find((s) => s.heading === popoverHeading);
      const res = await fetch("/api/lens/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideTitle: guide.title,
          sectionHeading: popoverHeading,
          selection: popoverText,
          surroundingContext: section?.content.slice(0, 1000),
        }),
      });
      if (!res.ok || !res.body) throw new Error("stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setExplanations((xs) =>
          xs.map((x) => (x.id === id ? { ...x, answer: acc } : x)),
        );
      }
      setExplanations((xs) =>
        xs.map((x) => (x.id === id ? { ...x, streaming: false } : x)),
      );
    } catch {
      setExplanations((xs) =>
        xs.map((x) =>
          x.id === id
            ? {
                ...x,
                streaming: false,
                answer:
                  "Sorry, something went wrong reaching Claude. Make sure ANTHROPIC_API_KEY is set in .env.local.",
              }
            : x,
        ),
      );
    }
  }

  async function toggleBeginnerMode() {
    const next = !beginnerMode;
    setBeginnerMode(next);
    if (!next) return;
    for (const section of sections) {
      if (section.id === "preamble") continue;
      if (rewrites[section.id]?.content) continue;
      setRewrites((r) => ({
        ...r,
        [section.id]: { streaming: true, content: "" },
      }));
      try {
        const res = await fetch("/api/lens/beginner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guideTitle: guide.title,
            sectionHeading: section.heading,
            sectionContent: section.content,
          }),
        });
        if (!res.ok || !res.body) throw new Error("stream failed");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setRewrites((r) => ({
            ...r,
            [section.id]: { streaming: true, content: acc },
          }));
        }
        setRewrites((r) => ({
          ...r,
          [section.id]: { streaming: false, content: acc },
        }));
      } catch {
        setRewrites((r) => ({
          ...r,
          [section.id]: {
            streaming: false,
            content:
              "_Couldn't rewrite this section — check ANTHROPIC_API_KEY._",
          },
        }));
      }
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target instanceof HTMLElement) {
            setActiveSection(e.target.dataset.sectionId ?? null);
          }
        }
      },
      { rootMargin: "-30% 0% -60% 0%", threshold: 0 },
    );
    contentRef.current
      ?.querySelectorAll("[data-section-id]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden xl:block w-64 shrink-0 border-r">
        <div className="sticky top-0 h-screen flex flex-col">
          <div className="h-14 border-b px-4 flex items-center shrink-0">
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/library">
                <ArrowLeft className="size-3.5" />
                Library
              </Link>
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Sections
            </p>
            <ul className="space-y-1 text-sm">
              {sections
                .filter((s) => s.level === 2)
                .map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={cn(
                        "block py-1.5 pl-3 border-l-2 -ml-0.5 transition-colors",
                        activeSection === s.id
                          ? "text-foreground font-medium border-primary"
                          : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/50",
                      )}
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="h-14 border-b px-6 flex items-center justify-between bg-background/80 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="size-4 text-muted-foreground shrink-0" />
            <p className="text-sm font-medium truncate">{guide.title}</p>
            <Badge
              variant="secondary"
              className="rounded-full text-xs capitalize shrink-0"
            >
              {guide.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={beginnerMode ? "default" : "outline"}
              size="sm"
              onClick={toggleBeginnerMode}
              className="gap-1.5"
            >
              <Sparkles className="size-3.5" />
              {beginnerMode ? "Beginner Mode" : "Beginner Mode off"}
            </Button>
          </div>
        </div>

        <div ref={contentRef} className="max-w-2xl mx-auto px-6 py-10 pb-32">
          <div className="mb-8 pb-6 border-b">
            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              {guide.title}
            </h1>
            <p className="text-muted-foreground">{guide.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {guide.tags.map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="text-xs rounded-full"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              data-section-id={section.id}
              data-section-heading={section.heading}
              className="mb-6 scroll-mt-20"
            >
              {section.heading !== "Overview" &&
                (section.level === 2 ? (
                  <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">
                    {section.heading}
                  </h2>
                ) : (
                  <h3 className="text-lg font-semibold mt-6 mb-2">
                    {section.heading}
                  </h3>
                ))}
              {beginnerMode && rewrites[section.id] ? (
                <div className="relative rounded-lg border-l-4 border-primary bg-accent/40 p-4 my-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-2">
                    <Sparkles className="size-3" />
                    Beginner rewrite
                    {rewrites[section.id].streaming && (
                      <Loader2 className="size-3 animate-spin ml-1" />
                    )}
                  </div>
                  <Markdown content={rewrites[section.id].content} />
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Show original
                    </summary>
                    <div className="mt-2">
                      <Markdown content={section.content} />
                    </div>
                  </details>
                </div>
              ) : (
                <Markdown content={section.content} />
              )}
            </section>
          ))}

          <div className="mt-16 pt-8 border-t text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Highlighter className="size-3.5" />
              Highlight any passage to get an explanation.
            </p>
          </div>
        </div>
      </div>

      <aside className="hidden md:block md:w-[380px] shrink-0 border-l">
        <div className="sticky top-0 h-screen flex flex-col">
          <div className="h-14 border-b px-3 flex items-center shrink-0">
            <Tabs
              value={rightTab}
              onValueChange={(v) => setRightTab(v as "lens" | "chat")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="lens" className="gap-1.5">
                  <Sparkles className="size-3.5" /> Lens
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-1.5">
                  <MessageSquare className="size-3.5" /> Chat
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 min-h-0">
            {rightTab === "lens" ? (
              <div
                className="h-full overflow-y-auto p-4 space-y-4"
                ref={rightRailRef}
              >
                {explanations.length === 0 ? (
                  <div className="text-sm text-muted-foreground space-y-3">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <Sparkles className="size-3.5 text-primary" />
                      The AI reads with you
                    </div>
                    <p className="leading-relaxed">
                      Highlight any sentence or paragraph in the guide. Claude
                      will explain it in plain English right here — no jargon
                      wall, no generic summary.
                    </p>
                    <p className="leading-relaxed">
                      Try selecting the formula in step 1 or the WACC equation
                      in step 2.
                    </p>
                  </div>
                ) : (
                  explanations.map((x) => (
                    <div
                      key={x.id}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                          <Sparkles className="size-3.5" />
                          {x.sectionHeading ?? "Lens"}
                        </div>
                        {x.streaming && (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <blockquote className="text-xs italic text-muted-foreground border-l-2 border-border pl-2 mb-3 line-clamp-3">
                        “{x.selection}”
                      </blockquote>
                      {x.answer ? (
                        <Markdown
                          content={x.answer}
                          className="text-sm [&>p]:text-sm"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="size-3 animate-spin" />
                          Thinking…
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <ChatPanel
                guideTitle={guide.title}
                guideContent={guide.content}
              />
            )}
          </div>
        </div>
      </aside>

      {popover && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: popover.x, top: popover.y }}
        >
          <div className="flex items-center gap-1 rounded-full border bg-popover text-popover-foreground shadow-lg px-1 py-1">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 rounded-full h-8"
              onClick={explainSelection}
            >
              <Sparkles className="size-3.5 text-primary" />
              Explain
            </Button>
            <div className="h-5 w-px bg-border" />
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 rounded-full h-8"
              onClick={() => setPopover(null)}
            >
              <Highlighter className="size-3.5" />
              Highlight
            </Button>
            <div className="h-5 w-px bg-border" />
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 rounded-full h-8"
              onClick={() => setPopover(null)}
            >
              <NotebookPen className="size-3.5" />
              Note
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full h-8 w-8"
              onClick={() => setPopover(null)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

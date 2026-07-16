"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Markdown } from "@/components/reader/markdown";
import { ChatPanel } from "@/components/reader/chat-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { splitStreamError } from "@/lib/streaming/stream-error";
import type { Guide, Section } from "@/lib/types";
import {
  Highlighter,
  X,
  Loader2,
  MessageSquare,
  BookOpen,
  ArrowLeft,
  Glasses,
  TextSearch,
} from "lucide-react";
import Link from "next/link";

type LensExplanation = {
  id: string;
  sectionHeading?: string;
  selection: string;
  answer: string;
  streaming: boolean;
  error?: string;
};

type BeginnerRewrite = { streaming: boolean; content: string; error?: string };

export function ReadingLens({ guide, sections }: { guide: Guide; sections: Section[] }) {
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
        const { content, error } = splitStreamError(acc);
        setExplanations((xs) =>
          xs.map((x) =>
            x.id === id ? { ...x, answer: content, ...(error !== null && { error }) } : x,
          ),
        );
      }
      setExplanations((xs) => xs.map((x) => (x.id === id ? { ...x, streaming: false } : x)));
    } catch {
      setExplanations((xs) =>
        xs.map((x) =>
          x.id === id
            ? {
                ...x,
                streaming: false,
                error: "Sorry, something went wrong. Please try highlighting the passage again.",
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
          const { content, error } = splitStreamError(acc);
          setRewrites((r) => ({
            ...r,
            [section.id]: { streaming: true, content, ...(error !== null && { error }) },
          }));
        }
        setRewrites((r) => {
          const current = r[section.id];
          return {
            ...r,
            [section.id]: {
              streaming: false,
              content: current?.content ?? "",
              ...(current?.error !== undefined && { error: current.error }),
            },
          };
        });
      } catch {
        setRewrites((r) => ({
          ...r,
          [section.id]: {
            streaming: false,
            content: "",
            error: "Couldn't rewrite this section. Toggle Beginner mode again to retry.",
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
    contentRef.current?.querySelectorAll("[data-section-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r xl:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex h-14 shrink-0 items-center border-b px-4">
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/learn">
                <ArrowLeft className="size-3.5" />
                Library
              </Link>
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <p className="eyebrow mb-3">Contents</p>
            <ul className="space-y-1 text-sm">
              {sections
                .filter((s) => s.level === 2)
                .map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={cn(
                        "-ml-0.5 flex items-baseline gap-2 border-l-2 py-1.5 pl-3 transition-colors",
                        activeSection === s.id
                          ? "text-primary border-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 border-transparent",
                      )}
                    >
                      <span className="font-mono text-[10px]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.heading}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="bg-background/80 sticky top-0 z-20 flex h-14 items-center justify-between border-b px-6 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <BookOpen className="text-muted-foreground size-4 shrink-0" />
            <p className="truncate text-sm font-medium">{guide.title}</p>
            <Badge variant="secondary" className="shrink-0">
              {guide.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={beginnerMode ? "default" : "outline"}
              size="sm"
              onClick={toggleBeginnerMode}
              className="gap-1.5"
              aria-pressed={beginnerMode}
            >
              <Glasses aria-hidden className="size-3.5" />
              Beginner mode
            </Button>
          </div>
        </div>

        <div ref={contentRef} className="mx-auto max-w-2xl px-6 py-10 pb-32">
          <div className="mb-8 border-b pb-6">
            <p className="eyebrow mb-3">
              {guide.readingMinutes ? `${guide.readingMinutes} min read` : "Guide"}
            </p>
            <h1 className="font-display mb-2 text-3xl">{guide.title}</h1>
            <p className="text-muted-foreground">{guide.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {guide.tags.map((t) => (
                <Badge key={t} variant="outline">
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
                  <h2 className="font-display mt-8 mb-3 text-2xl">{section.heading}</h2>
                ) : (
                  <h3 className="mt-6 mb-2 text-lg font-semibold">{section.heading}</h3>
                ))}
              {beginnerMode && rewrites[section.id] ? (
                <div className="border-primary bg-accent/40 relative my-2 rounded-sm border-l-2 p-4">
                  <div className="text-primary mb-2 flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] uppercase">
                    Beginner rewrite
                    {rewrites[section.id]?.streaming && (
                      <Loader2 aria-hidden className="ml-1 size-3 animate-spin" />
                    )}
                  </div>
                  <Markdown content={rewrites[section.id]?.content ?? ""} />
                  {rewrites[section.id]?.error && (
                    <p className="text-destructive mt-2 text-xs" role="alert">
                      {rewrites[section.id]?.error}
                    </p>
                  )}
                  <details className="mt-3 text-xs">
                    <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
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

          {/* The lens rail is desktop-only (hidden below md), so don't advertise
              highlighting where the output has nowhere to render. */}
          <div className="text-muted-foreground mt-16 hidden border-t pt-8 text-sm md:block">
            <p className="flex items-center gap-1.5">
              <Highlighter className="size-3.5" />
              Highlight any passage to get an explanation.
            </p>
          </div>
        </div>
      </div>

      <aside className="hidden shrink-0 border-l md:block md:w-[380px]">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex h-14 shrink-0 items-center border-b px-3">
            <Tabs
              value={rightTab}
              onValueChange={(v) => setRightTab(v as "lens" | "chat")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lens" className="gap-1.5">
                  <TextSearch aria-hidden className="size-3.5" /> Lens
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-1.5">
                  <MessageSquare aria-hidden className="size-3.5" /> Chat
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="min-h-0 flex-1">
            {rightTab === "lens" ? (
              <div className="h-full space-y-4 overflow-y-auto p-4" ref={rightRailRef}>
                {explanations.length === 0 ? (
                  <div className="text-muted-foreground space-y-3 text-sm">
                    <p className="eyebrow">The AI reads with you</p>
                    <p className="leading-relaxed">
                      Highlight any sentence or paragraph in the guide. Claude will explain it in
                      plain English right here — no jargon wall, no generic summary.
                    </p>
                    <p className="leading-relaxed">
                      Try selecting the formula in step 1 or the WACC equation in step 2.
                    </p>
                  </div>
                ) : (
                  explanations.map((x) => (
                    <div key={x.id} className="bg-card rounded-md border p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-primary font-mono text-[11px] tracking-[0.14em] uppercase">
                          {x.sectionHeading ?? "Lens"}
                        </p>
                        {x.streaming && (
                          <Loader2
                            aria-hidden
                            className="text-muted-foreground size-3 animate-spin"
                          />
                        )}
                      </div>
                      <blockquote className="text-muted-foreground border-border mb-3 line-clamp-3 border-l-2 pl-2 font-serif text-xs italic">
                        “{x.selection}”
                      </blockquote>
                      {x.answer ? (
                        <Markdown content={x.answer} className="text-sm [&>p]:text-sm" />
                      ) : x.error ? null : (
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <Loader2 className="size-3 animate-spin" />
                          Thinking…
                        </div>
                      )}
                      {x.error && (
                        <p className="text-destructive mt-2 text-xs" role="alert">
                          {x.error}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <ChatPanel guideTitle={guide.title} guideContent={guide.content} />
            )}
          </div>
        </div>
      </aside>

      {popover && (
        <div
          // max-md:hidden — the explanation rail doesn't exist below md, so
          // firing Explain there would stream tokens into an invisible panel.
          className="fixed z-50 -translate-x-1/2 -translate-y-full max-md:hidden"
          style={{ left: popover.x, top: popover.y }}
        >
          <div className="bg-popover text-popover-foreground flex items-center gap-1 rounded-md border p-1 shadow-md">
            <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={explainSelection}>
              <TextSearch aria-hidden className="text-primary size-3.5" />
              Explain
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setPopover(null)}
              aria-label="Dismiss"
            >
              <X aria-hidden className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

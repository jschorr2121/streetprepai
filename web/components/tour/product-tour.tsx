"use client";

import { useCallback, useEffect, useState } from "react";

import { completeTourAction } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";

export type TourStep = {
  /** CSS selector for the element this step points at, e.g. '[data-tour="nav-learn"]'. */
  selector: string;
  title: string;
  description: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

function measure(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

/**
 * First-time spotlight walkthrough. Steps through `steps` in order, dimming
 * the page and cutting out a highlight box around each step's target element
 * (pure CSS box-shadow spotlight — no canvas/SVG needed). Steps whose target
 * isn't in the DOM (e.g. sidebar-only elements on a small screen, where the
 * sidebar is hidden below `lg`) are skipped automatically.
 */
export function ProductTour({ steps, active }: { steps: TourStep[]; active: boolean }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const recompute = useCallback(() => {
    if (!active) return;
    // Skip forward past any steps whose target isn't present right now.
    let i = index;
    while (i < steps.length && !measure(steps[i]!.selector)) i++;
    if (i !== index) {
      setIndex(i);
      return;
    }
    setRect(i < steps.length ? measure(steps[i]!.selector) : null);
  }, [active, index, steps]);

  useEffect(() => {
    // Measure after paint (also keeps setState out of the synchronous effect body).
    const raf = requestAnimationFrame(recompute);
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [recompute]);

  const finish = useCallback(() => {
    setDismissed(true);
    completeTourAction().catch(() => {
      // Non-critical: worst case the tour shows again next session.
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  if (!active || dismissed || !rect || index >= steps.length) return null;

  const step = steps[index]!;
  const isLast = index === steps.length - 1;
  // Prefer placing the tooltip below the target; flip above if there's no room.
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const below = spaceBelow > 180;
  const tooltipTop = below ? rect.top + rect.height + 12 : Math.max(12, rect.top - 12);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Product tour">
      <button aria-label="Close tour" onClick={finish} className="fixed inset-0 cursor-default" />
      <div
        className="pointer-events-none fixed rounded-md transition-all duration-200"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)",
        }}
      />
      <div
        className="bg-popover text-popover-foreground border-border fixed z-10 w-80 rounded-md border p-4 shadow-lg transition-all duration-200"
        style={{
          top: below ? tooltipTop : undefined,
          bottom: below ? undefined : window.innerHeight - tooltipTop,
          left: Math.min(Math.max(12, rect.left), window.innerWidth - 332),
        }}
      >
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.1em] uppercase">
          {index + 1} / {steps.length}
        </p>
        <h3 className="mt-1 text-sm font-semibold">{step.title}</h3>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{step.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={finish}>
            Skip tour
          </Button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={isLast ? finish : () => setIndex((i) => i + 1)}>
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

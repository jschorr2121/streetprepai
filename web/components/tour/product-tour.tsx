"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  // display:none targets (e.g. the sidebar below lg) are in the DOM but
  // measure 0×0 — treat them as absent so the tour doesn't spotlight a
  // tiny box in the viewport corner.
  if (r.width === 0 && r.height === 0) return null;
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

/** Focusable descendants of `container`, in DOM order — used to trap Tab/Shift+Tab. */
function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
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
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const lastFocusedIndexRef = useRef<number | null>(null);

  const finish = useCallback(() => {
    setDismissed(true);
    completeTourAction().catch(() => {
      // Non-critical: worst case the tour shows again next session.
    });
  }, []);

  const recompute = useCallback(() => {
    if (!active || dismissed) return;
    // Skip forward past any steps whose target isn't present right now.
    let i = index;
    while (i < steps.length && !measure(steps[i]!.selector)) i++;
    if (i >= steps.length) {
      // Ran out of visible targets (e.g. the remaining steps point at the
      // sidebar, hidden below lg). Treat it as completing the tour — silently
      // unmounting without recording completion made it reappear forever.
      finish();
      return;
    }
    if (i !== index) {
      setIndex(i);
      return;
    }
    setRect(measure(steps[i]!.selector));
  }, [active, dismissed, index, steps, finish]);

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  // Capture whatever had focus before the tour opened, and restore it once
  // the tour closes (dismissed, or the parent flips `active` off).
  useEffect(() => {
    if (active && !dismissed) {
      if (!previousFocusRef.current) {
        previousFocusRef.current = document.activeElement as HTMLElement | null;
      }
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [active, dismissed]);

  // Move focus into the tooltip panel on activation and on every step change
  // (guarded by lastFocusedIndexRef so resize/scroll-triggered rect
  // recomputes — which produce a new `rect` object at the same step — don't
  // repeatedly steal focus).
  useEffect(() => {
    if (active && !dismissed && rect && lastFocusedIndexRef.current !== index) {
      panelRef.current?.focus({ preventScroll: true });
      lastFocusedIndexRef.current = index;
    }
  }, [active, dismissed, rect, index]);

  function trapTabKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const focusable = getFocusable(panelRef.current);
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

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
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={trapTabKey}
        className="bg-popover text-popover-foreground border-border fixed z-10 w-80 rounded-md border p-4 shadow-lg transition-all duration-200 outline-none"
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

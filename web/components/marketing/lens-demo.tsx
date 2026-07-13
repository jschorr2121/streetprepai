"use client";

import { useEffect, useRef, useState } from "react";

const TERMS = [
  {
    key: "discounting",
    term: "Discounting",
    text: "discounted back to today at a rate that reflects the riskiness of those cash flows",
    explanation:
      "A dollar arriving in 2030 is worth less than a dollar today — and the less certain that dollar is, the less you pay for it now. “Discounting” is just pricing in that wait and that risk.",
  },
  {
    key: "ufcf",
    term: "Unlevered free cash flow",
    text: "unlevered free cash flow",
    explanation:
      "The cash the business throws off before anyone gets paid interest — what’s available to everyone who financed the company, lenders and shareholders alike.",
  },
  {
    key: "wacc",
    term: "WACC",
    text: "WACC — the blended cost of the company’s debt and equity",
    explanation:
      "The average “rent” a company pays for its money. Debt is cheaper rent, equity costs more — WACC blends the two in proportion to how the company is funded.",
  },
] as const;

const CYCLE_MS = 4500;

function Highlight({
  index,
  active,
  onSelect,
  children,
}: {
  index: number;
  active: boolean;
  onSelect: (i: number) => void;
  children: React.ReactNode;
}) {
  // <mark> instead of <button>: form controls are atomic and refuse to
  // fragment across line boxes, which breaks the prose flow.
  return (
    <mark
      role="button"
      tabIndex={0}
      onClick={() => onSelect(index)}
      onMouseEnter={() => onSelect(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(index);
        }
      }}
      aria-pressed={active}
      className="cursor-pointer rounded-[2px] px-px text-inherit transition-colors duration-300"
      style={{
        background: active
          ? "var(--highlight-yellow)"
          : "color-mix(in oklab, var(--highlight-yellow) 35%, transparent)",
      }}
    >
      {children}
    </mark>
  );
}

/**
 * Interactive Reading Lens excerpt: hover or tap a highlighted passage and the
 * margin card swaps to its plain-English explanation. Auto-cycles until the
 * visitor interacts (never under reduced motion).
 */
export function LensDemo() {
  const [active, setActive] = useState(0);
  const interacted = useRef(false);

  const select = (i: number) => {
    interacted.current = true;
    setActive(i);
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (interacted.current) return;
      setActive((i) => (i + 1) % TERMS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const current = TERMS[active]!;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_minmax(240px,320px)]">
      <figure className="bg-card rounded-md border p-6 md:p-8">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <p className="eyebrow">Chapter 11 · DCF</p>
          <p className="eyebrow text-muted-foreground/70 max-md:hidden">Hover a highlight</p>
        </div>
        <p className="font-serif text-[17px] leading-[1.7]">
          A DCF values a company as the sum of its future free cash flows,{" "}
          <Highlight index={0} active={active === 0} onSelect={select}>
            {TERMS[0].text}
          </Highlight>
          . The discount rate for{" "}
          <Highlight index={1} active={active === 1} onSelect={select}>
            {TERMS[1].text}
          </Highlight>{" "}
          is{" "}
          <Highlight index={2} active={active === 2} onSelect={select}>
            {TERMS[2].text}
          </Highlight>
          .
        </p>
      </figure>

      <aside className="bg-card h-fit rounded-md border p-5" aria-live="polite">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <p className="eyebrow">In plain English</p>
          <p className="text-muted-foreground/70 font-mono text-[11px]">
            {String(active + 1).padStart(2, "0")}/{String(TERMS.length).padStart(2, "0")}
          </p>
        </div>
        <div key={current.key} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          <p className="font-display text-lg">{current.term}</p>
          <p className="mt-2 text-sm leading-relaxed">{current.explanation}</p>
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

const CHIPS: {
  eyebrow: string;
  text: string;
  figure?: string;
  pos: React.CSSProperties;
  delay: string;
  parallax: number;
}[] = [
  {
    eyebrow: "Mock · Technical",
    text: "Walk me through a DCF",
    figure: "86",
    pos: { right: "3%", top: "15%" },
    delay: "0s",
    parallax: 22,
  },
  {
    eyebrow: "Lens",
    text: "Explaining: WACC",
    pos: { right: "12%", top: "40%" },
    delay: "1.6s",
    parallax: 34,
  },
  {
    eyebrow: "Tracker",
    text: "Evercore — Superday",
    pos: { right: "4%", top: "62%" },
    delay: "0.8s",
    parallax: 14,
  },
];

/** 0-based column index → spreadsheet column letters (0 → A, 26 → AA). */
function colRef(n: number): string {
  let s = "";
  let i = Math.max(0, Math.floor(n));
  do {
    s = String.fromCharCode(65 + (i % 26)) + s;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return s;
}

/**
 * Decorative hero backdrop: faint graph-paper grid, a cursor crosshair with a
 * spreadsheet-style cell reference, and drifting ledger chips that parallax
 * against the mouse. Desktop pointer devices only; inert under reduced motion.
 */
export function HeroDesk() {
  const rootRef = useRef<HTMLDivElement>(null);
  const hLineRef = useRef<HTMLDivElement>(null);
  const vLineRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    let mx = 0;
    let my = 0;

    const render = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const x = mx - rect.left;
      const y = my - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      const opacity = inside ? "1" : "0";

      if (hLineRef.current) {
        hLineRef.current.style.opacity = opacity;
        hLineRef.current.style.transform = `translateY(${y}px)`;
      }
      if (vLineRef.current) {
        vLineRef.current.style.opacity = opacity;
        vLineRef.current.style.transform = `translateX(${x}px)`;
      }
      if (cellRef.current) {
        cellRef.current.style.opacity = opacity;
        cellRef.current.style.transform = `translate(${x + 12}px, ${y + 12}px)`;
        cellRef.current.textContent = `${colRef(x / 24)}${Math.floor(y / 24) + 1}`;
      }

      const cx = x / rect.width - 0.5;
      const cy = y / rect.height - 0.5;
      chipRefs.current.forEach((el, i) => {
        const factor = CHIPS[i]?.parallax ?? 0;
        if (!el) return;
        el.style.transform = `translate(${(-cx * factor).toFixed(1)}px, ${(-cy * factor).toFixed(1)}px)`;
      });
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
    >
      {/* Graph-paper grid, fading out toward the bottom */}
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px 24px)," +
            "repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px 24px)",
          maskImage: "linear-gradient(to bottom, black 30%, transparent 92%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 92%)",
        }}
      />

      {/* Cursor crosshair + cell reference */}
      <div
        ref={hLineRef}
        className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300"
        style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
      />
      <div
        ref={vLineRef}
        className="absolute inset-y-0 left-0 w-px opacity-0 transition-opacity duration-300"
        style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
      />
      <div
        ref={cellRef}
        className="text-primary/60 absolute top-0 left-0 font-mono text-[10px] tracking-[0.08em] opacity-0 transition-opacity duration-300"
      />

      {/* Drifting ledger chips */}
      {CHIPS.map((chip, i) => (
        <div
          key={chip.eyebrow}
          ref={(el) => {
            chipRefs.current[i] = el;
          }}
          className="absolute transition-transform duration-500 ease-out"
          style={chip.pos}
        >
          <div
            className="animate-chip-drift bg-card/90 flex items-center gap-3 rounded-sm border px-3 py-2 backdrop-blur-sm"
            style={{ animationDelay: chip.delay }}
          >
            <div>
              <p className="eyebrow">{chip.eyebrow}</p>
              <p className="mt-1 text-xs leading-none">{chip.text}</p>
            </div>
            {chip.figure && (
              <span className="text-primary font-mono text-sm font-medium">{chip.figure}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

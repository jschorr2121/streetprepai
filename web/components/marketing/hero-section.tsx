"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, TrendingUp, Mic, BookOpenText } from "lucide-react";

const floatingCards = [
  {
    icon: TrendingUp,
    label: "DCF Model",
    sub: "3-statement build",
    delay: "0s",
    x: "8%",
    y: "28%",
  },
  { icon: Mic, label: "Mock Interview", sub: "Score: 91/100", delay: "1.4s", x: "82%", y: "20%" },
  {
    icon: BookOpenText,
    label: "LBO Primer",
    sub: "Active reading",
    delay: "0.8s",
    x: "78%",
    y: "64%",
  },
  { icon: Sparkles, label: "AI Prep Sheet", sub: "Evercore TMT", delay: "2s", x: "6%", y: "66%" },
];

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPct = (x / rect.width) * 100;
      const yPct = (y / rect.height) * 100;

      if (gradientRef.current) {
        gradientRef.current.style.background = `
          radial-gradient(ellipse 70% 55% at ${xPct}% ${yPct}%, oklch(0.55 0.15 160 / 0.1) 0%, transparent 65%),
          radial-gradient(ellipse 45% 40% at ${100 - xPct * 0.3}% ${yPct * 0.4 + 60}%, oklch(0.55 0.15 160 / 0.05) 0%, transparent 55%)
        `;
      }
      if (orbRef.current) {
        orbRef.current.style.transform = `translate(${x - 160}px, ${y - 160}px)`;
      }
    };

    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-b px-6 pt-28 pb-24">
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, oklch(0.55 0.15 160 / 0.25) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      {/* Mouse-reactive gradient layer */}
      <div
        ref={gradientRef}
        className="pointer-events-none absolute inset-0 transition-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 50%, oklch(0.55 0.15 160 / 0.07) 0%, transparent 65%)",
        }}
      />

      {/* Cursor orb */}
      <div
        ref={orbRef}
        className="pointer-events-none absolute top-0 left-0 size-80 rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.15 160 / 0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
          transition: "transform 0.18s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />

      {/* Floating context cards — hidden on small screens */}
      {floatingCards.map((card) => (
        <div
          key={card.label}
          className="bg-card/80 animate-float-card absolute hidden items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-sm backdrop-blur-sm lg:flex"
          style={{
            left: card.x,
            top: card.y,
            animationDelay: card.delay,
          }}
        >
          <div className="bg-accent grid size-7 shrink-0 place-items-center rounded-md">
            <card.icon className="text-primary size-3.5" />
          </div>
          <div>
            <p className="text-xs leading-none font-semibold">{card.label}</p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">{card.sub}</p>
          </div>
        </div>
      ))}

      {/* Hero content */}
      <div className="relative mx-auto max-w-4xl text-center">
        <Badge variant="secondary" className="mb-6 gap-1.5 rounded-full px-3 py-1">
          <Sparkles className="size-3" /> Built for IB summer recruiting
        </Badge>

        <h1 className="mb-6 text-5xl leading-[1.03] font-semibold tracking-tight md:text-6xl lg:text-7xl">
          The recruiting cycle,
          <br />
          <span className="text-primary">reimagined with AI.</span>
        </h1>

        <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-xl">
          Street Prep AI is the first platform built end-to-end for IB recruiting. Prep smarter,
          practice out loud, network with memory, and track exactly what&apos;s holding you back —
          all in one place.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="shadow-primary/20 h-12 px-7 text-base shadow-md">
            <Link href="/dashboard">
              Open the demo
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-7 text-base">
            <Link href="/guide/walk-me-through-a-dcf">Try a guide</Link>
          </Button>
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          No signup required — prototype runs live against Claude.
        </p>
      </div>
    </section>
  );
}

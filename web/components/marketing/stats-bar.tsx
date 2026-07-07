"use client";

import { useEffect, useRef, useState } from "react";
import { Star, TrendingUp, Users, BookOpen, Award } from "lucide-react";

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setActive(true);
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return { count, ref };
}

export function StatsBar() {
  const { count: students, ref: r1 } = useCountUp(2847);
  const { count: rate, ref: r2 } = useCountUp(200);
  const { count: guides, ref: r3 } = useCountUp(32);

  return (
    <div className="bg-card border-b px-6 py-10">
      <div className="divide-border/50 mx-auto grid max-w-5xl grid-cols-2 gap-8 divide-x md:grid-cols-4">
        <div ref={r1} className="px-4 text-center">
          <div className="mb-1 flex items-center justify-center gap-1.5">
            <Users className="text-primary size-4" />
            <span className="text-3xl font-bold tabular-nums">{students.toLocaleString()}+</span>
          </div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            students enrolled
          </p>
        </div>

        <div ref={r2} className="px-4 text-center">
          <div className="mb-1 flex items-center justify-center gap-1.5">
            <TrendingUp className="text-primary size-4" />
            <span className="text-primary text-3xl font-bold tabular-nums">{rate}%</span>
          </div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            higher placement rate
          </p>
        </div>

        <div className="px-4 text-center">
          <div className="mb-1.5 flex items-center justify-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            4.9 / 5 avg rating
          </p>
        </div>

        <div ref={r3} className="px-4 text-center">
          <div className="mb-1 flex items-center justify-center gap-1.5">
            <BookOpen className="text-primary size-4" />
            <span className="text-3xl font-bold tabular-nums">{guides}+</span>
          </div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            expert guides
          </p>
        </div>
      </div>
    </div>
  );
}

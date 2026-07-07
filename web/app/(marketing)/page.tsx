import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeroDesk } from "@/components/marketing/hero-desk";
import { FirmTicker } from "@/components/marketing/firm-ticker";
import { LensDemo } from "@/components/marketing/lens-demo";
import { CountUp } from "@/components/marketing/count-up";
import { Reveal } from "@/components/marketing/reveal";

const FIGURES: { value: number; label: string }[] = [
  { value: 16, label: "chapters in the spine" },
  { value: 5, label: "tools live today" },
  { value: 1, label: "desk for the whole cycle" },
];

const CHAPTERS = [
  "The recruiting cycle & timeline",
  "How to apply",
  "Firm overviews",
  "Sector deep-dives",
  "Resume & cover letter",
  "Networking mastery",
  "Behavioral & fit",
  "Accounting",
  "Enterprise vs. equity value",
  "Comps & precedents",
  "DCF",
  "M&A",
  "LBO",
  "Brain teasers",
  "Mock interviews & HireVue",
  "Superday & logistics",
];

const TOOLS: { name: string; blurb: string; soon?: boolean }[] = [
  {
    name: "Mock Interview Studio",
    blurb:
      "Answer out loud. Whisper transcribes, AI scores content and delivery, then asks the follow-up a banker would.",
  },
  {
    name: "Resume Coach",
    blurb:
      "Upload your PDF. Weak bullets get flagged and rewritten side by side — you accept or reject each change.",
  },
  {
    name: "Relationship Manager",
    blurb:
      "Every coffee chat remembered. Prep sheets before calls, structured notes after, follow-ups drafted on time.",
  },
  {
    name: "Application Tracker",
    blurb: "Firms, roles, stages, and deadlines in one ledger — from shortlist to offer.",
  },
  {
    name: "Reading Lens",
    blurb:
      "Highlight anything in a chapter and get it explained in plain English, in the margin, without leaving the page.",
  },
  {
    name: "Question Bank",
    blurb:
      "Technicals by topic and difficulty, graded by AI, resurfaced right before you'd forget them.",
    soon: true,
  },
];

const STEPS: { title: string; body: string }[] = [
  {
    title: "Tell us where you are",
    body: "School, class year, semester. The whole product calibrates to your point in the cycle — what's urgent now, what can wait.",
  },
  {
    title: "Work the spine",
    body: "Sixteen chapters from timeline to Superday, weighted toward technicals. Read, practice, and ask the Lens when something doesn't land.",
  },
  {
    title: "Rehearse out loud",
    body: "Interviews aren't written exams. Voice mocks with scorecards turn what you know into what you can say under pressure.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-baseline gap-1.5">
            <span className="font-display text-lg leading-none">Street Prep</span>
            <span className="text-primary font-mono text-[11px] font-medium tracking-[0.14em]">
              AI
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Main">
            <a
              href="#contents"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contents
            </a>
            <a
              href="#tools"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Tools
            </a>
            <a
              href="#how"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="relative border-b">
          <HeroDesk />
          <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
            <p className="eyebrow">Investment banking recruiting, prepared properly</p>
            <h1 className="font-display mt-5 max-w-3xl text-4xl leading-[1.08] md:text-6xl">
              Prep for the job like it&apos;s already the job.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed">
              One desk for the whole recruiting cycle — a sixteen-chapter course spine, voice mock
              interviews, resume coaching, and a networking memory, with AI beside you in every one
              of them. Built for sophomores who are told they&apos;re already late.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start at chapter one
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-6 font-mono text-xs">
              A working prototype — every AI feature runs live.
            </p>
            <div className="bg-card mt-14 grid max-w-2xl grid-cols-3 divide-x rounded-md border">
              {FIGURES.map((figure) => (
                <div key={figure.label} className="px-4 py-4 md:px-5">
                  <CountUp target={figure.value} className="tabular text-2xl" />
                  <p className="eyebrow mt-1.5">{figure.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Firm ticker ────────────────────────────────────────── */}
        <FirmTicker />

        {/* ── Contents (the spine as a prospectus TOC) ───────────── */}
        <section id="contents" className="border-b">
          <Reveal className="mx-auto max-w-5xl px-6 py-16 md:py-20">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-3xl">Contents</h2>
              <p className="eyebrow">16 chapters · weighted toward technicals</p>
            </div>
            <ol className="mt-8 grid grid-cols-1 gap-x-12 md:grid-flow-col md:grid-cols-2 md:grid-rows-8">
              {CHAPTERS.map((title, i) => (
                <li
                  key={title}
                  className="group flex items-baseline gap-4 border-b py-3 last:border-b-0 md:nth-[8]:border-b-0"
                >
                  <span className="text-muted-foreground group-hover:text-primary w-6 shrink-0 font-mono text-xs transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm">{title}</span>
                </li>
              ))}
            </ol>
            <p className="text-muted-foreground mt-6 max-w-2xl text-sm">
              Reading is active: highlight any passage and the Lens explains it in the margin.
              Beginner mode rewrites a section with analogies when the jargon gets ahead of you.
            </p>
          </Reveal>
        </section>

        {/* ── Lens demo (interactive excerpt) ────────────────────── */}
        <section className="bg-muted/50 border-b">
          <Reveal className="mx-auto max-w-5xl px-6 py-16 md:py-20">
            <p className="eyebrow">The Reading Lens</p>
            <div className="mt-6">
              <LensDemo />
            </div>
          </Reveal>
        </section>

        {/* ── Tools index ────────────────────────────────────────── */}
        <section id="tools" className="border-b">
          <Reveal className="mx-auto max-w-5xl px-6 py-16 md:py-20">
            <h2 className="font-display text-3xl">The tools on the desk</h2>
            <ol className="mt-8">
              {TOOLS.map((tool, i) => (
                <li
                  key={tool.name}
                  className="grid grid-cols-[2rem_1fr] items-baseline gap-x-4 border-b py-5 first:border-t md:grid-cols-[2rem_240px_1fr]"
                >
                  <span className="text-muted-foreground font-mono text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-base font-medium">
                    {tool.name}
                    {tool.soon && (
                      <span className="text-muted-foreground/70 ml-2 font-mono text-[10px] tracking-[0.14em]">
                        SOON
                      </span>
                    )}
                  </h3>
                  <p className="text-muted-foreground col-start-2 mt-1 text-sm leading-relaxed md:col-start-3 md:mt-0">
                    {tool.blurb}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* ── How it works ───────────────────────────────────────── */}
        <section id="how" className="border-b">
          <Reveal className="mx-auto max-w-5xl px-6 py-16 md:py-20">
            <h2 className="font-display text-3xl">How it works</h2>
            <div className="mt-8 grid gap-px overflow-hidden rounded-md border md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="bg-card outline-border p-6 outline md:p-8">
                  <p className="text-muted-foreground font-mono text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-display mt-3 text-xl">{step.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-6 max-w-2xl text-sm">
              The AI lifts friction — it never does the thinking for you. Your stories stay yours;
              the work stays yours. That&apos;s the point.
            </p>
          </Reveal>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section>
          <Reveal className="mx-auto max-w-5xl px-6 py-20 text-center md:py-24">
            <h2 className="font-display mx-auto max-w-2xl text-3xl text-balance md:text-4xl">
              The cycle moved up a year. Start where you are.
            </h2>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get started
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-4 px-6 py-10 text-sm">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-foreground text-base leading-none">Street Prep</span>
            <span className="text-primary font-mono text-[10px] font-medium tracking-[0.14em]">
              AI
            </span>
          </div>
          <p className="font-mono text-xs">Prototype · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

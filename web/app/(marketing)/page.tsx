import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpenText,
  Mic,
  HeartHandshake,
  BarChart3,
  Sparkles,
  ArrowRight,
  NotebookPen,
  FileText,
  Building2,
  Highlighter,
  Check,
  Star,
  Quote,
} from "lucide-react";
import { HeroSection } from "@/components/marketing/hero-section";
import { LogoTicker } from "@/components/marketing/logo-ticker";
import { StatsBar } from "@/components/marketing/stats-bar";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md">
              <Sparkles className="size-4" />
            </div>
            <span>
              Street Prep <span className="text-primary font-semibold">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                Get started <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero (client — mouse tracking) ──────────────────────── */}
      <HeroSection />

      {/* ── Bank logos ticker ────────────────────────────────────── */}
      <LogoTicker />

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <StatsBar />

      {/* ── Problem ─────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-primary mb-2 text-sm font-medium">The problem</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              IB recruiting is won in tabs. That&apos;s broken.
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Wall Street Oasis for intel. BIWS for technicals. LinkedIn for bankers. Handshake for
              jobs. A Google Sheet for your networking. Nobody built a system for this — until now.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.title} className="bg-card rounded-xl border p-5">
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  {p.title}
                </p>
                <p className="text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="bg-muted/30 border-t px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="text-primary mb-2 text-sm font-medium">The product</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Every stage of recruiting,
              <br />
              with AI at the right moment
            </h2>
            <p className="text-muted-foreground mt-3">
              Twelve features, one coherent workflow. Each one replaces something students currently
              duct-tape together from five sites.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card hover:border-primary/30 group rounded-xl border p-5 transition-all duration-200 hover:shadow-md"
              >
                <div className="bg-accent text-accent-foreground group-hover:bg-primary/10 mb-4 grid size-9 place-items-center rounded-md transition-colors">
                  <f.icon className="group-hover:text-primary size-4 transition-colors" />
                </div>
                <h3 className="mb-1 font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section id="how" className="border-t px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-primary mb-2 text-sm font-medium">How it works</p>
          <h2 className="mb-10 text-3xl font-semibold tracking-tight md:text-4xl">
            Your recruiting cycle, from cold to offer
          </h2>
          <ol className="space-y-8">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-5">
                <div className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section className="bg-muted/20 border-t px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-primary mb-2 text-sm font-medium">Student stories</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Real results from real recruiting cycles
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card flex flex-col gap-4 rounded-xl border p-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="text-primary/40 size-5" />
                <p className="text-foreground/80 flex-1 text-sm leading-relaxed">{t.quote}</p>
                <div className="flex items-center gap-3 border-t pt-4">
                  <div className="bg-primary/10 text-primary grid size-8 place-items-center rounded-full text-xs font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Principles ──────────────────────────────────────────── */}
      <section className="border-t px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-primary mb-2 text-sm font-medium">Why this works</p>
          <h2 className="mb-10 text-3xl font-semibold tracking-tight md:text-4xl">
            You stay in the work. The AI stays beside you.
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="bg-card flex gap-4 rounded-xl border p-5">
                <div className="bg-accent grid size-8 shrink-0 place-items-center rounded-md">
                  <Check className="text-primary size-4" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{p.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="bg-muted/30 border-t px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-primary mb-2 text-sm font-medium">Pricing</p>
          <h2 className="mb-10 text-3xl font-semibold tracking-tight md:text-4xl">
            Priced for the cycle, not a subscription trap
          </h2>
          <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            <div className="bg-card rounded-xl border p-6">
              <p className="font-semibold">Free</p>
              <p className="mt-1 text-3xl font-semibold">$0</p>
              <p className="text-muted-foreground mt-2 mb-4 text-sm">Taste the product</p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>3 guides</li>
                <li>3 mock interviews / month</li>
                <li>Job feed</li>
              </ul>
            </div>
            <div className="border-primary bg-card shadow-primary/10 relative rounded-xl border-2 p-6 shadow-lg">
              <Badge className="absolute -top-2 right-4">Most popular</Badge>
              <p className="font-semibold">Season Pass</p>
              <p className="mt-1 text-3xl font-semibold">$149</p>
              <p className="text-muted-foreground mt-2 mb-4 text-sm">Full access Aug – Feb</p>
              <ul className="space-y-2 text-sm">
                <li>Full content library</li>
                <li>Unlimited mock interviews</li>
                <li>Resume coach + Story Framer</li>
                <li>Relationship memory</li>
                <li>Weak-area diagnostics</li>
              </ul>
            </div>
            <div className="bg-card rounded-xl border p-6">
              <p className="font-semibold">Pro Monthly</p>
              <p className="mt-1 text-3xl font-semibold">$29</p>
              <p className="text-muted-foreground mt-2 mb-4 text-sm">
                Flexible if you&apos;re off-cycle
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>Everything in Season Pass</li>
                <li>Cancel any time</li>
              </ul>
            </div>
          </div>
          <p className="text-muted-foreground mt-6 text-xs">
            University plans available for career centers — email hello@streetprep.ai.
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="border-t px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl">
            Your offer is won
            <br />
            in the <span className="text-primary">quiet weeks.</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Start the cycle with a system, not a tab graveyard.
          </p>
          <Button asChild size="lg" className="shadow-primary/20 h-12 px-7 shadow-md">
            <Link href="/signup">
              Get started
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="text-muted-foreground border-t px-6 py-10 text-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground grid size-5 place-items-center rounded">
              <Sparkles className="size-3" />
            </div>
            <span>
              Street Prep <span className="text-primary font-semibold">AI</span> — prototype
            </span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">
              Twitter
            </a>
            <a href="#" className="hover:text-foreground">
              Contact
            </a>
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const problems = [
  {
    title: "Too many tabs",
    body: "Students juggle 6+ platforms for one job search. Information is scattered, and so is progress.",
  },
  {
    title: "Passive content",
    body: "PDFs and video lectures don't stick. You finish a module and can't tell what you actually know.",
  },
  {
    title: "Forgotten relationships",
    body: "After 40 coffee chats, you can't remember what each banker said — or how to follow up well.",
  },
];

const features = [
  {
    icon: BookOpenText,
    title: "AI-assisted content library",
    description:
      "Guides across every IB interview topic. Highlight any passage for an instant plain-English explanation. Beginner Mode re-expresses the whole thing at your level.",
  },
  {
    icon: Mic,
    title: "Voice mock interviews",
    description:
      "Record your answer. Whisper transcribes; Claude scores content and delivery. Follow-up questions, model answers, and a trend chart over time.",
  },
  {
    icon: NotebookPen,
    title: "Behavioral Story Framer",
    description:
      "Type a raw experience. Claude returns five interview-ready framings — STAR leadership, teamwork, conflict, a resume bullet, a why-banking hook.",
  },
  {
    icon: HeartHandshake,
    title: "Relationship memory",
    description:
      "Every coffee chat logged, structured, and searchable. Pre-chat prep sheets and auto-drafted follow-ups. Past conversations resurface when you interview at that firm.",
  },
  {
    icon: Building2,
    title: "Firm intel & prep sheets",
    description:
      "AI-generated pre-interview briefs for every firm — recent earnings, notable deals, culture notes, and the right talking points.",
  },
  {
    icon: BarChart3,
    title: "Weak-area diagnostics",
    description:
      "Progress that tells you what to work on, not what you've done. Mock scores, flashcards, and reading signals all feed it.",
  },
  {
    icon: FileText,
    title: "Resume & deal sheet coach",
    description:
      "Upload your resume. Claude rewrites bullets in banker-speak, flags weak items, and builds your deal sheet.",
  },
  {
    icon: Highlighter,
    title: "Active-reading lens",
    description:
      "The AI reads with you, not for you. Highlight, ask follow-ups, auto-generate flashcards. Cognitive engagement, assisted.",
  },
  {
    icon: Sparkles,
    title: "Calendar integration",
    description:
      "Sync your calendar. Every upcoming coffee chat or interview gets an auto-generated prep sheet before you step into the room.",
  },
];

const steps = [
  {
    title: "Onboard and calibrate",
    body: "Tell Street Prep AI your school, year, target firms, and what you already know. The dashboard calibrates: here's what you're ready for, here's what you're not.",
  },
  {
    title: "Read actively",
    body: "Work through the content library on technicals, behavioral, firm guides, networking, modeling, and Superday logistics. Highlight anything you don't get — the AI explains in plain English in the side rail.",
  },
  {
    title: "Build your story bank",
    body: "Type a raw experience into the Story Framer. Get five interview-ready framings back. Saved framings feed the Mock Interview Studio automatically.",
  },
  {
    title: "Practice out loud",
    body: "Voice-based mock interviews with real scoring on content and delivery. Full Superday rotations for end-to-end dress rehearsal.",
  },
  {
    title: "Network with memory",
    body: "Every coffee chat, interview, and outreach lives in Relationships. Pre-chat prep sheets. Auto-drafted follow-ups. Past conversations surface the moment you schedule a new interview at that firm.",
  },
  {
    title: "Close the loop",
    body: "The progress page shows you the three weakest topics holding you back, with one-click drills. Spaced-repetition flashcards keep you sharp until offer day.",
  },
];

const testimonials = [
  {
    quote:
      "I went from not knowing what EBITDA stood for to landing a Goldman TMT offer in four months. The mock interview studio is the real deal — it scored me harder than any real interviewer.",
    name: "Aiden Park",
    initials: "AP",
    role: "Incoming SA · Goldman Sachs TMT",
  },
  {
    quote:
      "The Relationship Memory feature is what no one else has. I had 60+ coffee chats and every follow-up was specific and warm because the AI remembered what each banker told me.",
    name: "Maya Okonkwo",
    initials: "MO",
    role: "Incoming SA · Evercore M&A",
  },
  {
    quote:
      "I'm from a non-target and felt way behind. Street Prep AI gave me a system — not just content. The weak-area diagnostics told me exactly where to focus every week.",
    name: "Ryan Castellano",
    initials: "RC",
    role: "Incoming SA · Jefferies Leveraged Finance",
  },
];

const principles = [
  {
    title: "AI assists, doesn't replace",
    body: "We don't read for you, write your answers, or fake your stories. We lift friction, remember what you'd forget, and surface what to drill next.",
  },
  {
    title: "Outcomes over features",
    body: "Every feature exists because it maps to a step in the real recruiting cycle. No shiny demo features that don't change whether you get the offer.",
  },
  {
    title: "Built by and for finance students",
    body: 'Banker voice, banker rigor, banker-level specifics on firms and deals. None of the "AI slop" that students can see through instantly.',
  },
  {
    title: "Your data, your trust",
    body: "Relationship notes encrypted at rest. Never trained on. One-click export and delete. This is the personal kind of personal — and we treat it that way.",
  },
];

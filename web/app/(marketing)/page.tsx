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
  Briefcase,
  FileText,
  Building2,
  MessageSquare,
  Users,
  Highlighter,
  Check,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <div className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center">
              <Sparkles className="size-4" />
            </div>
            <span>
              Street Prep{" "}
              <span className="text-primary font-semibold">AI</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
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
              <Link href="/dashboard">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard">
                Try the demo <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="px-6 pt-24 pb-20 border-b">
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 py-1 px-3 rounded-full"
          >
            <Sparkles className="size-3" /> Built for IB summer recruiting
          </Badge>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
            The recruiting cycle,
            <br />
            <span className="text-muted-foreground">reimagined with AI.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Street Prep AI is the first platform built end-to-end for IB
            recruiting. Prep smarter, practice out loud, network with memory,
            and track exactly what's holding you back — all in one place, with
            AI woven into every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="h-11 px-6">
              <Link href="/dashboard">
                Open the demo
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-6">
              <Link href="/guide/walk-me-through-a-dcf">Try a guide</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            No signup required — prototype runs live against Claude.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-12 text-center mx-auto">
            <p className="text-sm font-medium text-primary mb-2">
              The problem
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              IB recruiting is won in tabs. That's broken.
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Wall Street Oasis for intel. BIWS for technicals. LinkedIn for
              bankers. Handshake for jobs. A Google Sheet for your networking.
              Nobody built a system for this — until now.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {problems.map((p) => (
              <div key={p.title} className="rounded-xl border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {p.title}
                </p>
                <p className="text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-muted/30 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-medium text-primary mb-2">
              The product
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Every stage of recruiting,
              <br />
              with AI at the right moment
            </h2>
            <p className="text-muted-foreground mt-3">
              Twelve features, one coherent workflow. Each one replaces
              something students currently duct-tape together from five sites.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow"
              >
                <div className="size-9 rounded-md bg-accent text-accent-foreground grid place-items-center mb-4">
                  <f.icon className="size-4" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-6 py-20 border-t">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-primary mb-2">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">
            Your recruiting cycle, from cold to offer
          </h2>
          <ol className="space-y-8">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-5">
                <div className="shrink-0 size-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-semibold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 py-20 border-t bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-medium text-primary mb-2">
            Why this works
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">
            You stay in the work. The AI stays beside you.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principles.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border bg-card p-5 flex gap-4"
              >
                <div className="shrink-0 size-8 rounded-md bg-accent grid place-items-center">
                  <Check className="size-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-20 border-t">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-primary mb-2">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">
            Priced for the cycle, not a subscription trap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="rounded-xl border bg-card p-6">
              <p className="font-semibold">Free</p>
              <p className="text-3xl font-semibold mt-1">$0</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Taste the product
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>3 guides</li>
                <li>3 mock interviews / month</li>
                <li>Job feed</li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-primary bg-card p-6 relative">
              <Badge className="absolute -top-2 right-4">Most popular</Badge>
              <p className="font-semibold">Season Pass</p>
              <p className="text-3xl font-semibold mt-1">$149</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Full access Aug – Feb
              </p>
              <ul className="text-sm space-y-2">
                <li>Full content library</li>
                <li>Unlimited mock interviews</li>
                <li>Resume coach + Story Framer</li>
                <li>Relationship memory</li>
                <li>Weak-area diagnostics</li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <p className="font-semibold">Pro Monthly</p>
              <p className="text-3xl font-semibold mt-1">$29</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Flexible if you're off-cycle
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>Everything in Season Pass</li>
                <li>Cancel any time</li>
                <li>Mentor sessions at-cost</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            University plans available for career centers — email hello@streetprep.ai.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 border-t">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Your offer is won
            <br />
            in the <span className="text-primary">quiet weeks.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start the cycle with a system, not a tab graveyard.
          </p>
          <Button asChild size="lg" className="h-11 px-6">
            <Link href="/dashboard">
              Open the demo
              <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t px-6 py-10 text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary text-primary-foreground grid place-items-center">
              <Sparkles className="size-3" />
            </div>
            <span>
              Street Prep{" "}
              <span className="text-primary font-semibold">AI</span> — prototype
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
    icon: Briefcase,
    title: "Job hub",
    description:
      "IB summer analyst roles, filtered by firm, group, region, and deadline. One click to the ATS.",
  },
  {
    icon: FileText,
    title: "Resume & deal sheet coach",
    description:
      "Upload your resume. Claude rewrites bullets in banker-speak, flags weak items, and builds your deal sheet.",
  },
  {
    icon: Users,
    title: "Mentor marketplace",
    description:
      "30-minute sessions with current analysts and associates at target firms. KYC-verified, revenue-shared.",
  },
  {
    icon: MessageSquare,
    title: "Peer community",
    description:
      "Interview reports and study groups, moderated. Every report becomes training signal for the mock interview question bank.",
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
    body: "Banker voice, banker rigor, banker-level specifics on firms and deals. None of the \"AI slop\" that students can see through instantly.",
  },
  {
    title: "Your data, your trust",
    body: "Relationship notes encrypted at rest. Never trained on. One-click export and delete. This is the personal kind of personal — and we treat it that way.",
  },
];

"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Users,
  Zap,
  Mic,
  BarChart3,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Model catalogue ─────────────────────────────────────────────────────────

type ModelKey = string;
type Provider = "anthropic" | "openai" | "google" | "groq";

interface ModelDef {
  label: string;
  shortLabel: string;
  provider: Provider;
  input: number; // $/1M tokens
  output: number;
  cacheRead: number;
  cacheWrite: number;
  note: string;
}

const MODELS: Record<ModelKey, ModelDef> = {
  "claude-opus-4-7": {
    label: "Claude Opus 4.7",
    shortLabel: "Opus 4.7",
    provider: "anthropic",
    input: 15,
    output: 75,
    cacheRead: 1.5,
    cacheWrite: 18.75,
    note: "Highest quality. Reserve for tasks where the quality gap is visible to users.",
  },
  "claude-sonnet-4-6": {
    label: "Claude Sonnet 4.6",
    shortLabel: "Sonnet 4.6",
    provider: "anthropic",
    input: 3,
    output: 15,
    cacheRead: 0.3,
    cacheWrite: 3.75,
    note: "Sweet spot for most features. Great reasoning + best prompt caching rate.",
  },
  "claude-haiku-4-5": {
    label: "Claude Haiku 4.5",
    shortLabel: "Haiku 4.5",
    provider: "anthropic",
    input: 1,
    output: 5,
    cacheRead: 0.1,
    cacheWrite: 1.25,
    note: "Best price/quality for short, structured tasks with clear templates.",
  },
  "gpt-4o": {
    label: "GPT-4o",
    shortLabel: "GPT-4o",
    provider: "openai",
    input: 2.5,
    output: 10,
    cacheRead: 1.25,
    cacheWrite: 2.5,
    note: "OpenAI flagship. Competitive with Sonnet. Higher output cost.",
  },
  "gpt-4o-mini": {
    label: "GPT-4o mini",
    shortLabel: "4o-mini",
    provider: "openai",
    input: 0.15,
    output: 0.6,
    cacheRead: 0.075,
    cacheWrite: 0.15,
    note: "Very cheap. Good for simple extractions, classification, short tasks.",
  },
  "gpt-4.1-nano": {
    label: "GPT-4.1 nano",
    shortLabel: "4.1 nano",
    provider: "openai",
    input: 0.1,
    output: 0.4,
    cacheRead: 0.025,
    cacheWrite: 0.1,
    note: "Cheapest OpenAI. Fast and lightweight. Ideal for fill-in-the-blank tasks.",
  },
  "gpt-5.4": {
    label: "GPT-5.4",
    shortLabel: "GPT-5.4",
    provider: "openai",
    input: 2.5,
    output: 15,
    cacheRead: 1.25,
    cacheWrite: 2.5,
    note: "OpenAI flagship 5.4. Strong reasoning and instruction following. Priced on par with GPT-4o.",
  },
  "gpt-5.4-mini": {
    label: "GPT-5.4 mini",
    shortLabel: "5.4 mini",
    provider: "openai",
    input: 0.75,
    output: 4.5,
    cacheRead: 0.375,
    cacheWrite: 0.75,
    note: "Mid-tier 5.4. Better than 4o-mini at 5× the price. Good for moderate-complexity tasks.",
  },
  "gpt-5.4-nano": {
    label: "GPT-5.4 nano",
    shortLabel: "5.4 nano",
    provider: "openai",
    input: 0.2,
    output: 1.25,
    cacheRead: 0.1,
    cacheWrite: 0.2,
    note: "Cheapest 5.4 tier. Fast, lightweight. Currently in use for general chat — same price as gpt-4.1-nano but newer generation.",
  },
  "o4-mini": {
    label: "o4-mini (reasoning)",
    shortLabel: "o4-mini",
    provider: "openai",
    input: 1.1,
    output: 4.4,
    cacheRead: 0.275,
    cacheWrite: 1.1,
    note: "Reasoning model. Strong for scoring rubrics and nuanced analysis. Slower.",
  },
  "gemini-2.5-flash": {
    label: "Gemini 2.5 Flash",
    shortLabel: "Gemini Flash",
    provider: "google",
    input: 0.15,
    output: 0.6,
    cacheRead: 0.0375,
    cacheWrite: 0.15,
    note: "Excellent price/performance. 1M token context. Very fast.",
  },
  "gemini-2.5-pro": {
    label: "Gemini 2.5 Pro",
    shortLabel: "Gemini Pro",
    provider: "google",
    input: 1.25,
    output: 10,
    cacheRead: 0.31,
    cacheWrite: 1.25,
    note: "Google's best. Largest context window. Competitive with Sonnet/Opus.",
  },
};

// ─── Feature definitions ──────────────────────────────────────────────────────

type UsageLevel = "light" | "medium" | "heavy";

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultModel: ModelKey;
  systemTokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheHitRate: number;
  callsPerMonth: Record<UsageLevel, number>;
  proOnly?: boolean;
  recommendation: ModelKey;
  recommendationNote: string;
}

const FEATURES: Feature[] = [
  {
    id: "lens_explain",
    name: "Lens: Explain Highlight",
    category: "Reading",
    description: "Highlighted text → plain-English explanation",
    defaultModel: "claude-sonnet-4-6",
    systemTokens: 300,
    inputTokens: 200,
    outputTokens: 300,
    cacheHitRate: 0.8,
    callsPerMonth: { light: 20, medium: 50, heavy: 120 },
    recommendation: "claude-haiku-4-5",
    recommendationNote:
      "Short context, short output, well-defined task. Haiku or GPT-4o-mini are both fine. Saves ~66–90% vs Sonnet.",
  },
  {
    id: "lens_beginner",
    name: "Lens: Beginner Rewrite",
    category: "Reading",
    description: "Rewrite full guide section in plain language",
    defaultModel: "claude-sonnet-4-6",
    systemTokens: 400,
    inputTokens: 800,
    outputTokens: 1000,
    cacheHitRate: 0.7,
    callsPerMonth: { light: 2, medium: 5, heavy: 15 },
    recommendation: "claude-sonnet-4-6",
    recommendationNote:
      "Quality matters — Haiku misses nuance in financial rewrites. Sonnet or Gemini 2.5 Flash are the right choices.",
  },
  {
    id: "guide_chat",
    name: "Guide Chat",
    category: "Reading",
    description: "Chat scoped to a guide (large cached context)",
    defaultModel: "claude-sonnet-4-6",
    systemTokens: 3500,
    inputTokens: 100,
    outputTokens: 400,
    cacheHitRate: 0.85,
    callsPerMonth: { light: 10, medium: 25, heavy: 60 },
    recommendation: "claude-sonnet-4-6",
    recommendationNote:
      "85% cache hit rate makes this cheap after the first call. Sonnet's $0.30/MTok cache_read is ideal.",
  },
  {
    id: "interview_score",
    name: "Interview Scoring",
    category: "Interview",
    description: "Full scorecard with rubric + model answer",
    defaultModel: "claude-opus-4-7",
    systemTokens: 2500,
    inputTokens: 1000,
    outputTokens: 2500,
    cacheHitRate: 0.6,
    callsPerMonth: { light: 2, medium: 4, heavy: 10 },
    proOnly: true,
    recommendation: "claude-sonnet-4-6",
    recommendationNote:
      '🚨 Biggest cost driver. Opus costs ~$0.22/mock; Sonnet is ~$0.05. Quality is ~90% as good. A/B test, keep Opus as an "Expert Review" upsell.',
  },
  {
    id: "draft_followup",
    name: "Draft Follow-up Email",
    category: "Relationships",
    description: "Auto-draft warm follow-up from structured chat notes",
    defaultModel: "claude-haiku-4-5",
    systemTokens: 600,
    inputTokens: 500,
    outputTokens: 300,
    cacheHitRate: 0.5,
    callsPerMonth: { light: 1, medium: 3, heavy: 8 },
    recommendation: "claude-haiku-4-5",
    recommendationNote:
      "Already on Haiku — correct. Short templated output. GPT-4o-mini is even cheaper if needed.",
  },
  {
    id: "draft_outreach",
    name: "Draft Cold Outreach",
    category: "Relationships",
    description: "Cold outreach email from LinkedIn bio + context",
    defaultModel: "claude-sonnet-4-6",
    systemTokens: 1000,
    inputTokens: 500,
    outputTokens: 800,
    cacheHitRate: 0.4,
    callsPerMonth: { light: 2, medium: 5, heavy: 12 },
    recommendation: "claude-sonnet-4-6",
    recommendationNote:
      'Product differentiator — "sounds like a real person, not a bot" requires Sonnet quality. Don\'t downgrade.',
  },
  {
    id: "prep_person",
    name: "Pre-Chat Prep Sheet",
    category: "Relationships",
    description: "Prep brief from banker LinkedIn bio",
    defaultModel: "claude-sonnet-4-6",
    systemTokens: 700,
    inputTokens: 500,
    outputTokens: 900,
    cacheHitRate: 0.3,
    callsPerMonth: { light: 4, medium: 12, heavy: 30 },
    recommendation: "claude-haiku-4-5",
    recommendationNote:
      "Structured template output. Haiku handles this well. Test it — saves ~66% vs Sonnet.",
  },
  {
    id: "structure_chat",
    name: "Structure Chat Notes",
    category: "Relationships",
    description: "Raw notes → structured JSON (tool use)",
    defaultModel: "claude-sonnet-4-6",
    systemTokens: 500,
    inputTokens: 600,
    outputTokens: 800,
    cacheHitRate: 0.4,
    callsPerMonth: { light: 4, medium: 15, heavy: 35 },
    recommendation: "claude-sonnet-4-6",
    recommendationNote:
      "Tool use + nuanced extraction. Haiku drops fields in complex JSON schemas. Keep Sonnet.",
  },
  {
    id: "resume_critique",
    name: "Resume Critique",
    category: "Resume",
    description: "Full resume review with inline rewrites",
    defaultModel: "claude-sonnet-4-6",
    systemTokens: 2700,
    inputTokens: 1500,
    outputTokens: 3000,
    cacheHitRate: 0.3,
    callsPerMonth: { light: 1, medium: 2, heavy: 4 },
    recommendation: "claude-sonnet-4-6",
    recommendationNote:
      "High-value, high-stakes. Opus adds marginal quality at 5× cost. Sonnet is right.",
  },
  {
    id: "firm_prep",
    name: "Firm Interview Prep",
    category: "Firms",
    description: "Firm brief from earnings + news context",
    defaultModel: "claude-sonnet-4-6",
    systemTokens: 700,
    inputTokens: 2000,
    outputTokens: 900,
    cacheHitRate: 0.7,
    callsPerMonth: { light: 3, medium: 10, heavy: 25 },
    recommendation: "claude-haiku-4-5",
    recommendationNote:
      "70% cache hit + pattern-matching on structured text. Haiku handles this well.",
  },
  {
    id: "general_chat",
    name: "General Chat",
    category: "General",
    description: "AI assistant with profile + history context injection per turn",
    defaultModel: "gpt-4.1-nano",
    systemTokens: 900,
    inputTokens: 700,
    outputTokens: 700,
    cacheHitRate: 0.6,
    callsPerMonth: { light: 30, medium: 100, heavy: 250 },
    recommendation: "gpt-4.1-nano",
    recommendationNote:
      "Cheapest option for long context chat. At 250 calls/mo heavy usage, cost per user jumps significantly vs short-form features — model choice here matters more than most. Haiku or GPT-4o-mini are both good alternatives.",
  },
  {
    id: "misc_buffer",
    name: "Miscellaneous buffer",
    category: "General",
    description: "Retries, edge cases, new features in development, unexpected spikes",
    defaultModel: "claude-haiku-4-5",
    systemTokens: 300,
    inputTokens: 300,
    outputTokens: 400,
    cacheHitRate: 0.2,
    callsPerMonth: { light: 10, medium: 30, heavy: 75 },
    recommendation: "claude-haiku-4-5",
    recommendationNote:
      "~10–15% buffer on top of known usage. Keeps estimates honest — real usage always runs higher than models predict.",
  },
];

const CATEGORY_ORDER = ["Reading", "Interview", "Relationships", "Resume", "Firms", "General"];

// ─── Whisper options ──────────────────────────────────────────────────────────

const WHISPER_OPTIONS = [
  { id: "openai", label: "OpenAI Whisper-1", shortLabel: "OpenAI", pricePerMin: 0.006 },
  { id: "groq", label: "Groq Whisper Large v3 Turbo", shortLabel: "Groq", pricePerMin: 0.0003 },
];

// ─── Infrastructure tiers ─────────────────────────────────────────────────────

const INFRA_TIERS = [
  {
    id: "hobby",
    label: "Bootstrapped",
    sublabel: "free tiers",
    vercel: 0,
    supabase: 0,
    domain: 1.25,
  },
  { id: "pro", label: "Pro", sublabel: "paid tiers", vercel: 20, supabase: 25, domain: 1.25 },
  { id: "growth", label: "Growth", sublabel: "scaling", vercel: 40, supabase: 100, domain: 1.25 },
];

// ─── Cost helpers ─────────────────────────────────────────────────────────────

function callCost(f: Feature, modelKey: ModelKey, intensity: UsageLevel): number {
  const m = MODELS[modelKey];
  if (!m) return 0;
  const per = (tok: number, rate: number) => (tok / 1_000_000) * rate;
  const miss =
    per(f.systemTokens, m.input) + per(f.inputTokens, m.input) + per(f.outputTokens, m.output);
  const hit =
    per(f.systemTokens, m.cacheRead) + per(f.inputTokens, m.input) + per(f.outputTokens, m.output);
  return (miss * (1 - f.cacheHitRate) + hit * f.cacheHitRate) * f.callsPerMonth[intensity];
}

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 10) return `$${n.toFixed(0)}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PROVIDER_STYLES: Record<Provider, { bg: string; text: string; dot: string }> = {
  anthropic: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  openai: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  google: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  groq: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
};

function ProviderPill({ modelKey, short = false }: { modelKey: ModelKey; short?: boolean }) {
  const m = MODELS[modelKey];
  if (!m) return null;
  const s = PROVIDER_STYLES[m.provider];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        s.bg,
        s.text,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {short ? m.shortLabel : m.label}
    </span>
  );
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{display}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className={cn(
            "h-1.5 w-full cursor-pointer appearance-none rounded-full",
            "bg-muted",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:size-4",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-primary",
            "[&::-webkit-slider-thumb]:shadow-md",
            "[&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:border-2",
            "[&::-webkit-slider-thumb]:border-card",
            "[&::-webkit-slider-thumb]:transition-transform",
            "[&::-webkit-slider-thumb]:hover:scale-110",
          )}
        />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "green" | "amber" | "red" | "neutral";
}) {
  const accentBorder = {
    green: "border-t-2 border-t-emerald-500",
    amber: "border-t-2 border-t-amber-400",
    red: "border-t-2 border-t-red-400",
    neutral: "",
  }[accent ?? "neutral"];

  const valColor = {
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-500",
    neutral: "text-foreground",
  }[accent ?? "neutral"];

  return (
    <Card className={cn("gap-0 px-5 py-5", accentBorder)}>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className={cn("mt-2 text-2xl leading-none font-bold tabular-nums", valColor)}>{value}</p>
      <p className="text-muted-foreground mt-1.5 text-xs">{sub}</p>
    </Card>
  );
}

function CostBar({
  label,
  model,
  cost,
  totalCost,
  maxCost,
  index,
  isTop,
}: {
  label: string;
  model: ModelKey;
  cost: number;
  totalCost: number;
  maxCost: number;
  index: number;
  isTop: boolean;
}) {
  const pct = maxCost > 0 ? Math.max((totalCost / maxCost) * 100, 2) : 0;
  return (
    <div className="group hover:bg-muted/40 px-5 py-3.5 transition-colors">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-muted-foreground w-5 shrink-0 text-xs tabular-nums">
            {index + 1}
          </span>
          <span className="truncate text-sm font-medium">{label}</span>
          <ProviderPill modelKey={model} short />
          {isTop && (
            <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
              top driver
            </span>
          )}
        </div>
        <div className="ml-3 flex shrink-0 items-center gap-3">
          <span className="text-muted-foreground text-xs tabular-nums">{fmt(cost)}/user</span>
          <span className="w-16 text-right text-sm font-semibold tabular-nums">
            {fmt(totalCost)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-7">
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isTop
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "from-primary/60 to-primary bg-gradient-to-r",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-muted-foreground w-8 text-right text-[10px] tabular-nums">
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PricingAnalysisPage() {
  const [freeUsers, setFreeUsers] = useState(500);
  const [proUsers, setProUsers] = useState(50);
  const [intensity, setIntensity] = useState<UsageLevel>("medium");
  const [proMonthly, setProMonthly] = useState(29);
  const [seasonPass, setSeasonPass] = useState(149);
  const [seasonFrac, setSeasonFrac] = useState(0.3);
  const [whisper, setWhisper] = useState("groq");
  const [infraTier, setInfraTier] = useState("hobby");
  const [recBanner, setRecBanner] = useState(false);
  const [modelSel, setModelSel] = useState<Record<string, ModelKey>>(() =>
    Object.fromEntries(FEATURES.map((f) => [f.id, f.defaultModel])),
  );

  const setModel = (id: string, key: ModelKey) => setModelSel((prev) => ({ ...prev, [id]: key }));

  const applyRecommended = () => {
    setModelSel(Object.fromEntries(FEATURES.map((f) => [f.id, f.recommendation])));
    setWhisper("groq");
    setRecBanner(false);
  };

  const deviatingFeatures = FEATURES.filter((f) => modelSel[f.id] !== f.recommendation);

  // ── computed ───────────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const whisperDef = WHISPER_OPTIONS.find((w) => w.id === whisper)!;
    const infraDef = INFRA_TIERS.find((t) => t.id === infraTier)!;
    const whisperMins = { light: 6, medium: 12, heavy: 30 }[intensity];
    const whisperPerUser = whisperMins * whisperDef.pricePerMin;

    const featureCosts: Record<string, number> = {};
    let aiPerProUser = 0;
    for (const f of FEATURES) {
      const c = callCost(f, modelSel[f.id]!, intensity);
      featureCosts[f.id] = c;
      aiPerProUser += c;
    }
    aiPerProUser += whisperPerUser;

    // free user cost: uncapped usage of non-pro-only features
    const freeCostPerUser = FEATURES.filter((f) => !f.proOnly).reduce((sum, f) => {
      const c = callCost(f, modelSel[f.id]!, "light");
      return sum + c * 0.4; // free users use ~40% as much as light pro users
    }, 0);

    const totalAiMonthly = aiPerProUser * proUsers + freeCostPerUser * freeUsers;
    const infraMonthly = infraDef.vercel + infraDef.supabase + infraDef.domain;
    const totalCosts = totalAiMonthly + infraMonthly;

    const subPros = Math.round(proUsers * (1 - seasonFrac));
    const seasonPros = proUsers - subPros;
    const monthlyRev = subPros * proMonthly + (seasonPros * seasonPass) / 7;
    const grossMargin = monthlyRev > 0 ? ((monthlyRev - totalCosts) / monthlyRev) * 100 : 0;
    const breakEven = Math.ceil(totalCosts / (proMonthly * 0.85));

    return {
      aiPerProUser,
      freeCostPerUser,
      featureCosts,
      totalAiMonthly,
      infraMonthly,
      totalCosts,
      monthlyRev,
      grossMargin,
      breakEven,
      whisperPerUser,
    };
  }, [
    freeUsers,
    proUsers,
    intensity,
    modelSel,
    whisper,
    infraTier,
    proMonthly,
    seasonPass,
    seasonFrac,
  ]);

  const sortedFeatures = useMemo(
    () =>
      FEATURES.map((f) => ({ ...f, totalCost: (calc.featureCosts[f.id] ?? 0) * proUsers })).sort(
        (a, b) => b.totalCost - a.totalCost,
      ),
    [calc, proUsers],
  );
  const maxFeatureCost = sortedFeatures[0]?.totalCost ?? 1;

  const marginAccent = calc.grossMargin > 60 ? "green" : calc.grossMargin > 25 ? "amber" : "red";
  const aiCostAccent = calc.aiPerProUser < 1 ? "green" : calc.aiPerProUser < 3 ? "amber" : "red";

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl space-y-7 px-6 py-8 md:px-8">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 className="text-primary size-5" />
            <h1 className="text-2xl font-semibold tracking-tight">AI Cost Calculator</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Model selection × user scale × usage intensity → monthly cost and margin.{" "}
            <span className="opacity-60">Prices as of May 2026.</span>
          </p>
        </div>
        <button
          onClick={() => setRecBanner((b) => !b)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm",
            "border transition-all",
            deviatingFeatures.length > 0
              ? "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
              : "border-border text-muted-foreground hover:border-border hover:bg-muted/50",
          )}
        >
          <Sparkles className="size-3.5" />
          {deviatingFeatures.length > 0
            ? `${deviatingFeatures.length} recommendation${deviatingFeatures.length > 1 ? "s" : ""} available`
            : "All models optimized"}
        </button>
      </div>

      {/* ── Recommendations banner ── */}
      {recBanner && (
        <Card className="border-primary/20 bg-primary/3 gap-0 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-foreground text-sm font-semibold">Apply all recommended models</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecBanner(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Dismiss
              </button>
              <button
                onClick={applyRecommended}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              >
                Apply all
              </button>
            </div>
          </div>
          {deviatingFeatures.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {deviatingFeatures.map((f) => (
                <li key={f.id} className="text-muted-foreground flex items-center gap-2 text-xs">
                  <ChevronRight className="text-primary size-3 shrink-0" />
                  <span className="text-foreground font-medium">{f.name}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <ProviderPill modelKey={modelSel[f.id]!} short />
                  <ArrowRight className="size-3" />
                  <ProviderPill modelKey={f.recommendation} short />
                </li>
              ))}
              {whisper !== "groq" && (
                <li className="text-muted-foreground flex items-center gap-2 text-xs">
                  <ChevronRight className="text-primary size-3 shrink-0" />
                  <span className="text-foreground font-medium">Whisper</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>switch to Groq (20× cheaper)</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-2 text-xs">
              All features are already on recommended models.
            </p>
          )}
        </Card>
      )}

      {/* ── Config row ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Scale */}
        <Card className="gap-0 space-y-5 px-5 py-5">
          <div className="flex items-center gap-2">
            <Users className="text-primary size-4" />
            <p className="text-sm font-semibold">User scale</p>
          </div>
          <SliderInput
            label="Free users"
            value={freeUsers}
            min={50}
            max={10000}
            step={50}
            onChange={setFreeUsers}
            display={freeUsers.toLocaleString()}
          />
          <SliderInput
            label="Pro users"
            value={proUsers}
            min={5}
            max={2500}
            step={5}
            onChange={setProUsers}
            display={proUsers.toLocaleString()}
          />
          <div className="text-muted-foreground flex items-center justify-between border-t pt-1 text-xs">
            <span>Conversion rate</span>
            <span className="font-medium tabular-nums">
              {((proUsers / (freeUsers + proUsers)) * 100).toFixed(1)}%
            </span>
          </div>
        </Card>

        {/* Intensity */}
        <Card className="gap-0 space-y-4 px-5 py-5">
          <div className="flex items-center gap-2">
            <Zap className="text-primary size-4" />
            <p className="text-sm font-semibold">Usage intensity</p>
          </div>
          <div className="space-y-2.5">
            {(["light", "medium", "heavy"] as UsageLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setIntensity(level)}
                className={cn(
                  "w-full rounded-lg border px-3.5 py-2.5 text-left transition-all",
                  intensity === level
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:border-border hover:bg-muted/40",
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      intensity === level ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium capitalize",
                      intensity === level ? "text-primary" : "text-foreground",
                    )}
                  >
                    {level}
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5 pl-4 text-xs">
                  {level === "light" && "2–3 sessions/wk · 1–2 mocks/mo"}
                  {level === "medium" && "5 sessions/wk · 4 mocks/mo"}
                  {level === "heavy" && "Daily use · 8+ mocks/mo"}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Revenue */}
        <Card className="gap-0 space-y-5 px-5 py-5">
          <div className="flex items-center gap-2">
            <DollarSign className="text-primary size-4" />
            <p className="text-sm font-semibold">Revenue assumptions</p>
          </div>
          <SliderInput
            label="Pro monthly price"
            value={proMonthly}
            min={9}
            max={79}
            step={1}
            onChange={setProMonthly}
            display={`$${proMonthly}/mo`}
          />
          <SliderInput
            label="Season pass price"
            value={seasonPass}
            min={49}
            max={299}
            step={10}
            onChange={setSeasonPass}
            display={`$${seasonPass}`}
          />
          <SliderInput
            label="% paying season pass"
            value={seasonFrac * 100}
            min={0}
            max={100}
            step={5}
            onChange={(v) => setSeasonFrac(v / 100)}
            display={`${Math.round(seasonFrac * 100)}%`}
          />
        </Card>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Total monthly cost"
          value={fmt(calc.totalCosts)}
          sub={`${fmt(calc.totalAiMonthly)} AI + ${fmt(calc.infraMonthly)} infra`}
          accent="neutral"
        />
        <KpiCard
          label="AI cost / pro user"
          value={fmt(calc.aiPerProUser)}
          sub={`${fmt(calc.freeCostPerUser)} / free user`}
          accent={aiCostAccent}
        />
        <KpiCard
          label="Monthly revenue"
          value={fmt(calc.monthlyRev)}
          sub={`${proUsers} paying users`}
          accent="neutral"
        />
        <KpiCard
          label="Gross margin"
          value={`${calc.grossMargin.toFixed(0)}%`}
          sub={`Break-even @ ${calc.breakEven} pro users`}
          accent={marginAccent}
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="models">
        <TabsList className="mb-1">
          <TabsTrigger value="models">Model selector</TabsTrigger>
          <TabsTrigger value="breakdown">Cost breakdown</TabsTrigger>
          <TabsTrigger value="infra">Infrastructure</TabsTrigger>
          <TabsTrigger value="recs">Recommendations</TabsTrigger>
        </TabsList>

        {/* ── MODEL SELECTOR ── */}
        <TabsContent value="models">
          <Card className="gap-0 overflow-hidden px-0 py-0">
            {/* Whisper row */}
            <div className="bg-muted/30 border-b px-5 py-2">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                Interview · Audio
              </p>
            </div>
            <div className="flex items-center gap-4 border-b px-5 py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Mic className="text-muted-foreground size-3.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Whisper Transcription</p>
                  <p className="text-muted-foreground text-xs">
                    Voice → text. Priced per minute of audio.
                  </p>
                </div>
              </div>
              <div className="w-52 shrink-0">
                <Select value={whisper} onValueChange={setWhisper}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WHISPER_OPTIONS.map((w) => (
                      <SelectItem key={w.id} value={w.id} className="text-xs">
                        {w.label} · ${w.pricePerMin}/min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {fmt(calc.whisperPerUser * proUsers)}/mo
                </p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {fmt(calc.whisperPerUser)}/user
                </p>
              </div>
            </div>

            {/* Feature rows grouped by category */}
            {CATEGORY_ORDER.map((cat) => {
              const features = FEATURES.filter((f) => f.category === cat);
              if (!features.length) return null;
              return (
                <div key={cat}>
                  <div className="bg-muted/30 border-b px-5 py-2">
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                      {cat}
                    </p>
                  </div>
                  {features.map((f, i) => {
                    const sel = modelSel[f.id];
                    const costPerUser = calc.featureCosts[f.id] ?? 0;
                    const totalForFeature = costPerUser * proUsers;
                    const isOptimal = sel === f.recommendation;
                    return (
                      <div
                        key={f.id}
                        className={cn(
                          "hover:bg-muted/20 flex items-center gap-4 px-5 py-3.5 transition-colors",
                          i < features.length - 1 ? "border-b" : "",
                          !isOptimal ? "bg-amber-50/40" : "",
                        )}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{f.name}</p>
                            {f.proOnly && (
                              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                                pro only
                              </Badge>
                            )}
                            {isOptimal && (
                              <span className="text-primary flex items-center gap-0.5 text-[10px] font-medium">
                                <CheckCircle2 className="size-3" /> optimal
                              </span>
                            )}
                            {!isOptimal && (
                              <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
                                <AlertTriangle className="size-3" /> suboptimal
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs">{f.description}</p>
                          <p className="text-muted-foreground/70 text-[11px]">
                            {f.callsPerMonth[intensity]} calls/mo ·{" "}
                            {Math.round(f.cacheHitRate * 100)}% cache
                          </p>
                        </div>
                        <div className="w-52 shrink-0">
                          <Select value={sel} onValueChange={(v) => setModel(f.id, v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(MODELS).map(([key, m]) => (
                                <SelectItem key={key} value={key} className="text-xs">
                                  <span className="flex items-center gap-1.5">
                                    <span
                                      className={cn(
                                        "size-1.5 shrink-0 rounded-full",
                                        PROVIDER_STYLES[m.provider].dot,
                                      )}
                                    />
                                    {m.label}
                                    {key === f.recommendation && (
                                      <span className="text-primary ml-0.5">★</span>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-28 shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">
                            {fmt(totalForFeature)}/mo
                          </p>
                          <p className="text-muted-foreground text-xs tabular-nums">
                            {fmt(costPerUser)}/user
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Card>
        </TabsContent>

        {/* ── COST BREAKDOWN ── */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card className="gap-0 overflow-hidden px-0 py-0">
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <div>
                <p className="text-sm font-semibold">Monthly AI cost by feature</p>
                <p className="text-muted-foreground text-xs">
                  Across {proUsers} pro users at <span className="font-medium">{intensity}</span>{" "}
                  intensity
                </p>
              </div>
              <p className="text-foreground text-sm font-bold tabular-nums">
                {fmt(calc.totalAiMonthly)} total
              </p>
            </div>
            {sortedFeatures.map((f, i) => (
              <CostBar
                key={f.id}
                label={f.name}
                model={modelSel[f.id]!}
                cost={calc.featureCosts[f.id] ?? 0}
                totalCost={f.totalCost}
                maxCost={maxFeatureCost}
                index={i}
                isTop={i < 3}
              />
            ))}
            {/* Whisper */}
            <div className={cn("hover:bg-muted/40 border-t px-5 py-3.5 transition-colors")}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-muted-foreground w-5 shrink-0 text-xs tabular-nums">
                    {sortedFeatures.length + 1}
                  </span>
                  <Mic className="text-muted-foreground size-3.5" />
                  <span className="text-sm font-medium">Whisper Transcription</span>
                  <span className="text-muted-foreground text-xs">
                    {WHISPER_OPTIONS.find((w) => w.id === whisper)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {fmt(calc.whisperPerUser)}/user
                  </span>
                  <span className="w-16 text-right text-sm font-semibold tabular-nums">
                    {fmt(calc.whisperPerUser * proUsers)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Per-user cost at all intensities */}
          <Card className="gap-0 px-5 py-5">
            <p className="mb-4 text-sm font-semibold">Cost per pro user at each intensity</p>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "medium", "heavy"] as UsageLevel[]).map((lvl) => {
                const perUser = FEATURES.reduce((sum, f) => {
                  const m = MODELS[modelSel[f.id]!];
                  if (!m) return sum;
                  const per = (tok: number, rate: number) => (tok / 1_000_000) * rate;
                  const miss =
                    per(f.systemTokens, m.input) +
                    per(f.inputTokens, m.input) +
                    per(f.outputTokens, m.output);
                  const hit =
                    per(f.systemTokens, m.cacheRead) +
                    per(f.inputTokens, m.input) +
                    per(f.outputTokens, m.output);
                  return (
                    sum +
                    (miss * (1 - f.cacheHitRate) + hit * f.cacheHitRate) * f.callsPerMonth[lvl]
                  );
                }, 0);
                const wMins = { light: 6, medium: 12, heavy: 30 }[lvl];
                const wCost =
                  wMins * (WHISPER_OPTIONS.find((w) => w.id === whisper)?.pricePerMin ?? 0.006);
                const total = perUser + wCost;
                const marginPct =
                  proMonthly > 0 ? (((proMonthly - total) / proMonthly) * 100).toFixed(0) : "—";
                return (
                  <div
                    key={lvl}
                    className={cn(
                      "rounded-xl border p-4 text-center transition-all",
                      lvl === intensity ? "border-primary/40 bg-primary/5" : "bg-muted/30",
                    )}
                  >
                    <p
                      className={cn(
                        "mb-2 text-xs font-semibold tracking-wide capitalize uppercase",
                        lvl === intensity ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {lvl}
                    </p>
                    <p className="text-foreground text-2xl font-bold tabular-nums">{fmt(total)}</p>
                    <p className="text-muted-foreground mt-1 text-xs">/ user / mo</p>
                    <div className="mt-2 border-t pt-2 text-xs">
                      <span className="text-muted-foreground">Margin: </span>
                      <span className="text-foreground font-semibold">{marginPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* ── INFRASTRUCTURE ── */}
        <TabsContent value="infra" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {INFRA_TIERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setInfraTier(t.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  infraTier === t.id
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card hover:border-border hover:bg-muted/30",
                )}
              >
                <p
                  className={cn(
                    "text-sm font-semibold",
                    infraTier === t.id ? "text-primary" : "text-foreground",
                  )}
                >
                  {t.label}
                </p>
                <p className="text-muted-foreground text-xs">{t.sublabel}</p>
                <p className="text-foreground mt-2 text-2xl font-bold tabular-nums">
                  {fmt(t.vercel + t.supabase + t.domain)}
                  <span className="text-muted-foreground text-sm font-normal">/mo</span>
                </p>
                <div className="text-muted-foreground mt-3 space-y-1 border-t pt-3 text-xs">
                  <div className="flex justify-between">
                    <span>Vercel</span>
                    <span className="font-medium">{t.vercel === 0 ? "Free" : `$${t.vercel}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supabase</span>
                    <span className="font-medium">
                      {t.supabase === 0 ? "Free" : `$${t.supabase}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domain</span>
                    <span className="font-medium">~$1.25</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Card className="gap-0 space-y-3 px-5 py-5">
            <p className="text-sm font-semibold">When to upgrade</p>
            {[
              {
                icon: CheckCircle2,
                color: "text-primary",
                text: "Vercel Hobby is fine until you need team access or exceed 100GB bandwidth/mo. Pro ($20/mo) is safe to defer until you're past a few hundred DAUs.",
              },
              {
                icon: CheckCircle2,
                color: "text-primary",
                text: "Supabase Free supports 500MB DB and 50k MAU — sufficient for seed data + early auth. Move to Pro ($25/mo) when you hit 50k MAU or need pgvector for semantic recall.",
              },
              {
                icon: AlertTriangle,
                color: "text-amber-500",
                text: "pgvector for semantic relationship recall is on Supabase Pro. Budget $25+/mo when you implement real semantic search in Phase 1.",
              },
              {
                icon: Info,
                color: "text-blue-500",
                text: "Your OpenAI API key (Whisper + general chat) is a separate billing account. Groq Whisper is 20× cheaper — migrate immediately.",
              },
            ].map(({ icon: Icon, color, text }, i) => (
              <div key={i} className="text-muted-foreground flex gap-3 text-sm">
                <Icon className={cn("mt-0.5 size-4 shrink-0", color)} />
                <p>{text}</p>
              </div>
            ))}
          </Card>
        </TabsContent>

        {/* ── RECOMMENDATIONS ── */}
        <TabsContent value="recs" className="space-y-4">
          {/* Top 3 actions */}
          <div className="grid gap-3">
            {[
              {
                badge: "Critical",
                badgeColor: "bg-red-50 text-red-700 border-red-200",
                borderColor: "border-l-4 border-l-red-400",
                title: "Switch Interview Scoring: Opus → Sonnet",
                saving: `Saves ${fmt(
                  (callCost(
                    FEATURES.find((f) => f.id === "interview_score")!,
                    "claude-opus-4-7",
                    intensity,
                  ) -
                    callCost(
                      FEATURES.find((f) => f.id === "interview_score")!,
                      "claude-sonnet-4-6",
                      intensity,
                    )) *
                    proUsers,
                )}/mo at current scale`,
                detail:
                  'Opus at $15/$75/MTok on a 3,500-token scoring call costs ~$0.22 per mock. Sonnet is ~$0.05. Quality delta is real but 10–15% — not dealbreaking at launch. Start Sonnet, A/B test, offer Opus as an "Expert Review" upsell at $2–3/session.',
              },
              {
                badge: "Quick win",
                badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
                borderColor: "border-l-4 border-l-amber-400",
                title: "Switch Whisper to Groq (whisper-large-v3-turbo)",
                saving: `Saves ${fmt((0.006 - 0.0003) * { light: 6, medium: 12, heavy: 30 }[intensity] * proUsers)}/mo`,
                detail:
                  "OpenAI whisper-1 costs $0.006/min. Groq is $0.0003/min — the same model, 20× cheaper. Add a GROQ_API_KEY env var and swap the endpoint. This is a 30-minute change.",
              },
              {
                badge: "Easy win",
                badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
                borderColor: "border-l-4 border-l-blue-400",
                title: "Lens Explain + Pre-Chat Prep → Haiku",
                saving: `Saves ${fmt(
                  (callCost(
                    FEATURES.find((f) => f.id === "lens_explain")!,
                    "claude-sonnet-4-6",
                    intensity,
                  ) -
                    callCost(
                      FEATURES.find((f) => f.id === "lens_explain")!,
                      "claude-haiku-4-5",
                      intensity,
                    ) +
                    (callCost(
                      FEATURES.find((f) => f.id === "prep_person")!,
                      "claude-sonnet-4-6",
                      intensity,
                    ) -
                      callCost(
                        FEATURES.find((f) => f.id === "prep_person")!,
                        "claude-haiku-4-5",
                        intensity,
                      ))) *
                    proUsers,
                )}/mo combined`,
                detail:
                  "Lens Explain: 200-token input, 300-token output — short and well-defined. Haiku is fast and accurate enough. Pre-Chat Prep: structured template output from LinkedIn bio. Haiku handles this well. Test both, revert if quality complaints come in.",
              },
            ].map((rec) => (
              <Card key={rec.title} className={cn("gap-0 px-5 py-4", rec.borderColor)}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          rec.badgeColor,
                        )}
                      >
                        {rec.badge}
                      </span>
                      <p className="text-foreground text-sm font-semibold">{rec.title}</p>
                    </div>
                    <p className="text-primary text-xs font-medium">{rec.saving}</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{rec.detail}</p>
              </Card>
            ))}
          </div>

          {/* Full recommendation table */}
          <Card className="gap-0 overflow-hidden px-0 py-0">
            <div className="bg-muted/30 border-b px-5 py-3.5">
              <p className="text-sm font-semibold">All feature recommendations</p>
              <p className="text-muted-foreground text-xs">
                ★ marks the recommended model in each dropdown
              </p>
            </div>
            <div className="divide-y">
              {FEATURES.map((f) => {
                const current = modelSel[f.id]!;
                const isOptimal = current === f.recommendation;
                return (
                  <div key={f.id} className={cn("px-5 py-3.5", !isOptimal && "bg-amber-50/30")}>
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{f.name}</p>
                          {isOptimal ? (
                            <span className="text-primary flex items-center gap-0.5 text-[10px] font-medium">
                              <CheckCircle2 className="size-3" />
                              optimal
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
                              <AlertTriangle className="size-3" />
                              could improve
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                          <span>Now: </span>
                          <ProviderPill modelKey={current} short />
                          {!isOptimal && (
                            <>
                              <ArrowRight className="size-3" />
                              <span>Rec: </span>
                              <ProviderPill modelKey={f.recommendation} short />
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
                        {f.recommendationNote}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className="bg-muted/20 px-5 py-3.5">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <Mic className="text-muted-foreground size-3.5" />
                      <p className="text-sm font-medium">Whisper</p>
                      {whisper === "groq" ? (
                        <span className="text-primary flex items-center gap-0.5 text-[10px] font-medium">
                          <CheckCircle2 className="size-3" />
                          optimal
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
                          <AlertTriangle className="size-3" />
                          could improve
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {WHISPER_OPTIONS.find((w) => w.id === whisper)?.label}
                    </p>
                  </div>
                  <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
                    Switch to Groq whisper-large-v3-turbo. Same model, 20× cheaper ($0.0003 vs
                    $0.006/min). 30-minute migration.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Margin strategy note */}
          <Card className="gap-0 px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown className="text-primary size-4" />
              <p className="text-sm font-semibold">Margin strategy</p>
            </div>
            <div className="text-muted-foreground space-y-2.5 text-sm">
              <p>
                With recommended models at medium intensity, AI cost per pro user is roughly{" "}
                <span className="text-foreground font-semibold">$0.30–0.60/mo</span> — under{" "}
                <span className="text-foreground font-semibold">2% of the $29 price point</span>.
                That&apos;s an extremely healthy SaaS margin.
              </p>
              <p>
                The main risk is free users. At light intensity, each free user costs
                ~$0.05–0.10/mo. With 500 free users, that&apos;s $25–50/mo. Enforce hard daily
                limits (3 explains/day, 3 mocks/mo) to keep this predictable.
              </p>
              <p>
                The Season Pass ($149 for ~7 months = $21/mo equivalent) has a lower monthly margin
                than the $29 subscription. At scale, consider raising to $179–199 or adding an
                incentive for the monthly plan.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-muted-foreground/60 pb-4 text-center text-xs">
        Prices are estimates as of May 2026. Verify with Anthropic, OpenAI, Google AI, and Groq
        before committing. Cache hit rates are modeled — actual rates depend on real session
        patterns.
      </p>
    </div>
  );
}

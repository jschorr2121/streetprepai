"use client";

import { useMemo, useState } from "react";
import { seedJobs, allFirms, allRegions, allTiers } from "@/lib/data/jobs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, ArrowUpRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobsPage() {
  const [q, setQ] = useState("");
  const [firm, setFirm] = useState("all");
  const [region, setRegion] = useState("all");
  const [tier, setTier] = useState("all");

  const filtered = useMemo(() => {
    return seedJobs.filter((j) => {
      if (q && !`${j.firm} ${j.role} ${j.group ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (firm !== "all" && j.firm !== firm) return false;
      if (region !== "all" && j.location !== region) return false;
      if (tier !== "all" && !j.tags.includes(tier)) return false;
      return true;
    });
  }, [q, firm, region, tier]);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <Briefcase className="size-4" /> Job Hub
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          IB Summer Analyst roles, in one feed
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Filter by firm, group, region, and tier. One click to the ATS.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search firm, role, group…"
            className="pl-9"
          />
        </div>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="md:w-36"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            {allTiers.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "BB" ? "Bulge bracket" : t === "EB" ? "Elite boutique" : "Middle market"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="md:w-40"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {allRegions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={firm} onValueChange={setFirm}>
          <SelectTrigger className="md:w-48"><SelectValue placeholder="Firm" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All firms</SelectItem>
            {allFirms.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length} role{filtered.length === 1 ? "" : "s"} matching your filters
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((j) => {
          const soonDeadline =
            j.deadline && new Date(j.deadline).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 14;
          return (
            <a
              key={j.id}
              href={j.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <p className="font-semibold">{j.firm}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {j.role} · {j.group}
                  </p>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {j.location} · {j.yearTarget}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex flex-wrap gap-1">
                  {j.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px] rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
                {j.deadline && (
                  <p className={cn(
                    "text-[11px] font-medium",
                    soonDeadline ? "text-rose-600" : "text-muted-foreground",
                  )}>
                    Due {j.deadline}
                  </p>
                )}
              </div>
            </a>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground text-center py-12 border-dashed border rounded-lg">
            No roles match those filters.
          </div>
        )}
      </div>
    </div>
  );
}

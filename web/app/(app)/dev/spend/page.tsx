import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { listMyUsageSince, startOfUtcMonth, type MyUsageRow } from "@/lib/db/queries/ai-usage";

// Self-scoped AI spend tracker — reads only the signed-in user's own
// ai_usage rows (RLS-enforced via withUser), broken down by endpoint and
// model so you can see where testing cost is going. Not linked from the
// sidebar; visit /dev/spend directly.
export const metadata = { title: "Dev Spend — Street Prep AI" };
export const dynamic = "force-dynamic";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
const num = new Intl.NumberFormat("en-US");

function startOfUtcDay(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="eyebrow">{label}</p>
      <p className="tabular mt-1 text-2xl">{value}</p>
      {sub && <p className="text-muted-foreground mt-1 text-xs">{sub}</p>}
    </Card>
  );
}

type Rollup = { key: string; calls: number; inTok: number; outTok: number; usd: number };

function rollupBy(rows: MyUsageRow[], keyOf: (r: MyUsageRow) => string): Rollup[] {
  const map = new Map<string, Rollup>();
  for (const r of rows) {
    const key = keyOf(r);
    const acc = map.get(key) ?? { key, calls: 0, inTok: 0, outTok: 0, usd: 0 };
    acc.calls += 1;
    acc.inTok += r.inputTokens;
    acc.outTok += r.outputTokens;
    acc.usd += r.costUsd;
    map.set(key, acc);
  }
  return [...map.values()].sort((a, b) => b.usd - a.usd);
}

const sum = (rows: MyUsageRow[]) => rows.reduce((t, r) => t + r.costUsd, 0);

function RollupTable({ title, rows }: { title: string; rows: Rollup[] }) {
  return (
    <div className="mb-8">
      <p className="eyebrow mb-2">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="py-2 pr-4 font-normal">Name</th>
              <th className="py-2 pr-4 text-right font-normal">Calls</th>
              <th className="py-2 pr-4 text-right font-normal">In tok</th>
              <th className="py-2 pr-4 text-right font-normal">Out tok</th>
              <th className="py-2 text-right font-normal">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b last:border-0">
                <td className="py-2 pr-4 font-mono text-xs">{r.key}</td>
                <td className="tabular py-2 pr-4 text-right">{num.format(r.calls)}</td>
                <td className="tabular text-muted-foreground py-2 pr-4 text-right">
                  {num.format(r.inTok)}
                </td>
                <td className="tabular text-muted-foreground py-2 pr-4 text-right">
                  {num.format(r.outTok)}
                </td>
                <td className="tabular py-2 text-right">{usd.format(r.usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function DevSpendPage() {
  const user = await requireUser();

  const now = new Date();
  const monthRows = await withUser({ sub: user.id, role: "authenticated" }, (tx) =>
    listMyUsageSince(tx, user.id, startOfUtcMonth(now)),
  );
  const todayStart = startOfUtcDay(now);
  const todayRows = monthRows.filter((r) => r.createdAt >= todayStart);

  const byEndpoint = rollupBy(monthRows, (r) => r.endpoint);
  const byModel = rollupBy(monthRows, (r) => r.model);
  const recent = monthRows.slice(0, 50);

  const monthLabel = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
      <PageHeader
        eyebrow="Dev · Token Spend"
        title="Your AI spend"
        description={`Your own ai_usage ledger · ${monthLabel} (UTC). Cost is modeled from lib/ai/pricing.ts — cross-check the authoritative total in the Anthropic Console.`}
      />

      {monthRows.length === 0 ? (
        <p className="text-muted-foreground mt-8 text-sm">
          No AI spend recorded yet this month. Grade an answer, run a mock interview, or use any AI
          tool and it&apos;ll show up here.
        </p>
      ) : (
        <>
          <section className="mt-8 mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Today"
              value={usd.format(sum(todayRows))}
              sub={`${todayRows.length} calls`}
            />
            <Stat
              label="This month"
              value={usd.format(sum(monthRows))}
              sub={`${monthRows.length} calls`}
            />
            <Stat
              label="Tokens (mo)"
              value={num.format(monthRows.reduce((t, r) => t + r.inputTokens + r.outputTokens, 0))}
              sub="in + out"
            />
            <Stat
              label="Cache reads"
              value={num.format(monthRows.reduce((t, r) => t + r.cacheReadTokens, 0))}
              sub="tokens"
            />
          </section>

          <RollupTable title="By model · this month" rows={byModel} />
          <RollupTable title="By feature (endpoint) · this month" rows={byEndpoint} />

          <p className="eyebrow mb-2">Recent calls</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-normal">When (UTC)</th>
                  <th className="py-2 pr-4 font-normal">Endpoint</th>
                  <th className="py-2 pr-4 font-normal">Model</th>
                  <th className="py-2 pr-4 text-right font-normal">Tokens</th>
                  <th className="py-2 text-right font-normal">Cost</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={`${r.createdAt}-${i}`} className="border-b last:border-0">
                    <td className="text-muted-foreground py-2 pr-4 font-mono text-xs">
                      {r.createdAt.slice(5, 16).replace("T", " ")}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{r.endpoint}</td>
                    <td className="text-muted-foreground py-2 pr-4 text-xs">{r.model}</td>
                    <td className="tabular text-muted-foreground py-2 pr-4 text-right">
                      {num.format(r.inputTokens + r.outputTokens)}
                    </td>
                    <td className="tabular py-2 text-right">{usd.format(r.costUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

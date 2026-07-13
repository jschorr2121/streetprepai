import { PageHeader } from "@/components/page-header";

const PLANNED = [
  "Coverage area and market map",
  "Recent deals in the sector",
  "Top firms and groups covering it",
  "Key terminology and multiples reference",
];

export default async function SectorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="Sector · coming soon"
        title={label}
        description="Sector deep-dive — coverage area, recent deals, top firms, and key terminology."
      />
      <div className="mt-8 rounded-md border border-dashed p-6">
        <p className="eyebrow">Planned</p>
        <ul className="mt-4 space-y-2.5">
          {PLANNED.map((item, i) => (
            <li key={item} className="flex gap-3 text-sm">
              <span className="text-muted-foreground font-mono text-xs leading-5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

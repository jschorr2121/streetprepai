import { Layers } from "lucide-react";

export default async function SectorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="bg-accent text-accent-foreground mb-6 grid size-12 place-items-center rounded-md">
        <Layers className="size-5" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">{label}</h1>
      <p className="text-muted-foreground max-w-prose">
        Sector deep-dive — coming soon. Will include coverage area, recent deals, top firms in the
        sector, and key terminology.
      </p>
    </div>
  );
}

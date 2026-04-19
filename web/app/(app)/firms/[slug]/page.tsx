import { notFound } from "next/navigation";
import { seedFirms } from "@/lib/data/firms";
import { FirmPrep } from "@/components/firms/firm-prep";

export default async function FirmPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const firm = seedFirms.find((f) => f.slug === slug);
  if (!firm) notFound();
  return <FirmPrep firm={firm} />;
}

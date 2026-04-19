import { notFound } from "next/navigation";
import { getGuideBySlug, parseSections } from "@/lib/data/guides";
import { ReadingLens } from "@/components/reader/reading-lens";

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();
  const sections = parseSections(guide.content);
  return <ReadingLens guide={guide} sections={sections} />;
}

import { PageHeader } from "@/components/page-header";

const PLANNED = [
  'Paste one raw experience, get five STAR-structured angles: leadership, teamwork, conflict, failure, and "why banking"',
  "Structured Claude tool use with a confidence score per angle",
  "Saved stories sync to your Story Bank",
  "Stories feed directly into Mock Interview Studio prompts",
];

export default function StoryFramerPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="Tool · coming soon"
        title="Story Framer"
        description="Paste a raw experience and Claude reframes it as STAR stories for leadership, teamwork, conflict, and more — saved to your Story Bank and wired into the Mock Interview Studio."
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

import { PageHeader } from "@/components/page-header";

const PLANNED = [
  "Curated and AI-generated technical questions across accounting, valuation, M&A, and LBO",
  "Difficulty tiers with follow-up question trees",
  "Spaced repetition re-surfaces items you've missed",
  "Performance tracked into your Progress dashboard",
];

export default function QuestionBankPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="Tool · coming soon"
        title="Question Bank"
        description="Curated and AI-generated technical questions with difficulty levels, follow-up trees, and spaced re-surfacing of weak items."
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

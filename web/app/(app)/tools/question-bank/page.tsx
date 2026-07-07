import { ListChecks } from "lucide-react";

export default function QuestionBankPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="bg-accent text-accent-foreground mb-6 grid size-12 place-items-center rounded-md">
        <ListChecks className="size-5" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Technical Question Bank</h1>
      <p className="text-muted-foreground max-w-prose">
        Curated and AI-generated technical questions with difficulty levels, follow-up trees, and
        spaced re-surfacing of weak items. Coming soon.
      </p>
    </div>
  );
}

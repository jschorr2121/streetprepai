import { PageHeader } from "@/components/page-header";

const PLANNED = [
  "Full tool-using Claude chatbot, not scoped to a single guide",
  "Reads your profile, story bank, and progress data for personalized answers",
  "Cites sources back to the guide or firm page it pulled from",
  "Persistent chat history across sessions",
];

export default function ChatbotPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <PageHeader
        eyebrow="Tool · coming soon"
        title="Chatbot"
        description="Until this ships, the chat panel inside the Reading Lens (right rail on any guide) answers questions scoped to the guide you're reading."
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

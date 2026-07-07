import { MessageSquare } from "lucide-react";

export default function ChatbotPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="bg-accent text-accent-foreground mb-6 grid size-12 place-items-center rounded-md">
        <MessageSquare className="size-5" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Chatbot</h1>
      <p className="text-muted-foreground max-w-prose">
        Tool-using Claude chatbot — coming soon. Until then, the chat panel inside the Reading Lens
        (right rail on any guide) answers questions scoped to the guide you&apos;re reading.
      </p>
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Construction } from "lucide-react";

export default function InterviewStubPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <Mic className="size-4" /> Mock Interview Studio
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Voice-based interview practice
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Record your answer. Whisper transcribes. Claude scores content,
          structure, and delivery. Follow-ups from a real interviewer's
          perspective.
        </p>
      </header>
      <Card className="p-8 text-center space-y-4 border-dashed">
        <div className="size-12 rounded-full bg-accent mx-auto grid place-items-center">
          <Construction className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Next up in the prototype</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
            The recording UI + scoring scorecard are the next build. The backend
            prompt + rubric are already designed in <code>lib/ai/prompts.ts</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <Badge variant="secondary">Technical mode</Badge>
          <Badge variant="secondary">Behavioral mode</Badge>
          <Badge variant="secondary">Firm-specific mode</Badge>
          <Badge variant="secondary">Full Superday rotation</Badge>
        </div>
      </Card>
    </div>
  );
}

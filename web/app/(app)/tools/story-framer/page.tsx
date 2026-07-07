import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotebookPen, Sparkles } from "lucide-react";

export default function StoryFramerStubPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <header className="mb-6">
        <div className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
          <NotebookPen className="size-4" /> Behavioral Story Framer
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          One experience, five interview answers
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Paste a raw experience. Claude reframes it as STAR stories for leadership, teamwork,
          conflict, a resume bullet, and a &quot;why banking&quot; hook — saved to your Story Bank
          and wired into the Mock Interview Studio.
        </p>
      </header>
      <Card className="space-y-4 border-dashed p-8 text-center">
        <div className="bg-accent mx-auto grid size-12 place-items-center rounded-full">
          <Sparkles className="text-primary size-5" />
        </div>
        <div>
          <p className="font-semibold">Shipping next</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm leading-relaxed">
            The AI side is already designed — structured Claude tool use with a schema for
            multi-angle STAR framings and a confidence score per angle.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          <Badge variant="secondary">Leadership</Badge>
          <Badge variant="secondary">Teamwork</Badge>
          <Badge variant="secondary">Conflict</Badge>
          <Badge variant="secondary">Failure</Badge>
          <Badge variant="secondary">Resume bullet</Badge>
          <Badge variant="secondary">Why banking</Badge>
        </div>
      </Card>
    </div>
  );
}

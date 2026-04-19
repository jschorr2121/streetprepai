import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotebookPen, Sparkles } from "lucide-react";

export default function StoryFramerStubPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <NotebookPen className="size-4" /> Behavioral Story Framer
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          One experience, five interview answers
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Paste a raw experience. Claude reframes it as STAR stories for
          leadership, teamwork, conflict, a resume bullet, and a "why banking"
          hook — saved to your Story Bank and wired into the Mock Interview
          Studio.
        </p>
      </header>
      <Card className="p-8 text-center space-y-4 border-dashed">
        <div className="size-12 rounded-full bg-accent mx-auto grid place-items-center">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Shipping next</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
            The AI side is already designed — structured Claude tool use with a
            schema for multi-angle STAR framings and a confidence score per
            angle.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
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

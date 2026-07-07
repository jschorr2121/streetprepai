import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";

export default function NewContactStubPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1">
        <Link href="/tools/relationships">
          <ArrowLeft className="size-3.5" />
          Back to relationships
        </Link>
      </Button>
      <Card className="border-dashed p-8 text-center">
        <div className="bg-accent mx-auto mb-4 grid size-12 place-items-center rounded-full">
          <Plus className="text-primary size-5" />
        </div>
        <p className="font-semibold">Add contact — coming in MVP</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm leading-relaxed">
          Full add-contact flow: paste LinkedIn bio → AI extracts role/firm/group → calendar
          integration suggests linking to upcoming events.
        </p>
      </Card>
    </div>
  );
}

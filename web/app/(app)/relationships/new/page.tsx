import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";

export default function NewContactStubPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 md:px-8 py-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 mb-4 -ml-2">
        <Link href="/relationships">
          <ArrowLeft className="size-3.5" />
          Back to relationships
        </Link>
      </Button>
      <Card className="p-8 text-center border-dashed">
        <div className="size-12 rounded-full bg-accent mx-auto grid place-items-center mb-4">
          <Plus className="size-5 text-primary" />
        </div>
        <p className="font-semibold">Add contact — coming in MVP</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
          Full add-contact flow: paste LinkedIn bio → AI extracts role/firm/group
          → calendar integration suggests linking to upcoming events.
        </p>
      </Card>
    </div>
  );
}

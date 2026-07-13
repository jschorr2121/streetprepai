import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";

const PLANNED = [
  "Paste a LinkedIn bio — Claude extracts role, firm, and group",
  "Calendar integration suggests linking to upcoming events",
  "Manual entry fallback for contacts without a LinkedIn profile",
];

export default function NewContactStubPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1">
        <Link href="/tools/relationships">
          <ArrowLeft className="size-3.5" />
          Back to relationships
        </Link>
      </Button>
      <PageHeader
        eyebrow="Tool · coming soon"
        title="Add a contact"
        description="Full add-contact flow: paste a LinkedIn bio and Claude extracts role, firm, and group — with calendar integration suggesting links to upcoming events."
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

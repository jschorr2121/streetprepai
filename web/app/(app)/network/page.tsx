import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Star } from "lucide-react";

const mentors = [
  { name: "Rachel Lee", firm: "Goldman Sachs", group: "TMT", tier: "1st year Analyst", rate: 60, school: "Wharton" },
  { name: "Daniel O'Connor", firm: "Evercore", group: "M&A", tier: "2nd year Analyst", rate: 75, school: "Yale" },
  { name: "Sofia Ramirez", firm: "Morgan Stanley", group: "Healthcare", tier: "Associate", rate: 120, school: "Columbia" },
  { name: "Eli Cohen", firm: "Centerview Partners", group: "Generalist", tier: "1st year Analyst", rate: 80, school: "Harvard" },
];

export default function NetworkPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <Users className="size-4" /> Mentors
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Book 30 minutes with a real analyst
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Paid sessions with current IB analysts and associates at target
          firms. Revenue-shared; mentors are KYC-verified via work email.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mentors.map((m) => (
          <Card key={m.name} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {m.tier} · {m.firm} {m.group ? `· ${m.group}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{m.school} alum</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="size-3.5 fill-current" />
                <span className="text-xs font-medium">4.9</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm font-semibold">${m.rate}</p>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Calendar className="size-3.5" />
                Book 30 min
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-8">
        Mentor marketplace is stubbed in the prototype. Full booking,
        scheduling, and payment flow ships in MVP.
      </p>
    </div>
  );
}

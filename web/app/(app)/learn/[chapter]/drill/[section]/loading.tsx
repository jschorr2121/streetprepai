import { Skeleton } from "@/components/ui/skeleton";

export default function DrillLoading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8 md:px-8">
      <Skeleton className="h-8 w-32 rounded-md" />
      <div className="mt-6 space-y-2">
        <Skeleton className="h-6 w-72 max-w-full" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="mt-8 rounded-lg border p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-5 w-full" />
        <Skeleton className="mt-2 h-5 w-4/5" />
        <Skeleton className="mt-6 h-28 w-full rounded-md" />
        <Skeleton className="mt-4 h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}

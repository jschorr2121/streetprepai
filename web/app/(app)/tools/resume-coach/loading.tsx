import { Skeleton } from "@/components/ui/skeleton";

export default function ResumeLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-72" />

      <div className="mt-8 flex flex-col items-center gap-4 rounded-md border border-dashed p-12">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="mt-6 space-y-2 rounded-md border p-6">
        <Skeleton className="h-5 w-36" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

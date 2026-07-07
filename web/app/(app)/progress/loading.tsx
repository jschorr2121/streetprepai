import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <Skeleton className="h-8 w-40" />

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md border p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-10 h-6 w-36" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md border p-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

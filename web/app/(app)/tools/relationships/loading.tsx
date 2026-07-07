import { Skeleton } from "@/components/ui/skeleton";

export default function RelationshipsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md border p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-6 w-16" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-8 h-6 w-32" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

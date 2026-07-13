import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
      <div className="border-b pb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-64" />
      </div>

      <div className="bg-card mt-8 grid grid-cols-1 divide-y rounded-md border md:grid-cols-3 md:divide-x md:divide-y-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-md border p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-5 w-48" />
            <Skeleton className="mt-2 h-3 w-full" />
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-md border p-5">
            <Skeleton className="h-3 w-32" />
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="mt-3 h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

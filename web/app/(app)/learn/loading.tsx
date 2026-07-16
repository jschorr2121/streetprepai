import { Skeleton } from "@/components/ui/skeleton";

export default function LearnLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <div className="mb-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-8 w-96 max-w-full" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      </div>

      <Skeleton className="mb-8 h-20 w-full rounded-xl" />

      {[0, 1].map((section) => (
        <div key={section} className="mb-10">
          <div className="mb-3 border-b pb-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-4">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="mt-3 h-5 w-48" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-1 h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

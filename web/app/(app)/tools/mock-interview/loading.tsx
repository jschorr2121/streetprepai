import { Skeleton } from "@/components/ui/skeleton";

export default function InterviewLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
      <header className="mb-8 border-b pb-6">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
      </header>

      {/* Mode picker */}
      <div className="rounded-md border p-5">
        <Skeleton className="h-3 w-28" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 rounded-md border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Past sessions */}
      <div className="mt-8 space-y-4 rounded-md border p-5">
        <Skeleton className="h-3 w-28" />
        <div className="divide-y rounded-md border">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

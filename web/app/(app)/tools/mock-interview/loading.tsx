import { Skeleton } from "@/components/ui/skeleton";

export default function InterviewLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-16 md:px-8">
      <Skeleton className="h-6 w-64" />
      <div className="w-full space-y-3 rounded-md border p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>

      <div className="w-full space-y-3 rounded-md border p-5">
        <Skeleton className="h-3 w-28" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-1">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

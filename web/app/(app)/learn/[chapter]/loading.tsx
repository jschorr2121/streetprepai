import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-8 w-80 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-2/3" />

      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
            <Skeleton className="size-8 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-56 max-w-full" />
              <Skeleton className="mt-2 h-3 w-36" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

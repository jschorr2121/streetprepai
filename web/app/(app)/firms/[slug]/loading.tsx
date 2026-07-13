import { Skeleton } from "@/components/ui/skeleton";

export default function FirmDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full max-w-xl" />
      </div>

      <div className="mt-6 space-y-3 rounded-md border p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-44" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>

      <Skeleton className="mt-8 h-5 w-36" />
      <div className="mt-4 space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-md border p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

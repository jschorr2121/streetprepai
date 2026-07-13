import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-56" />
      <div className="mt-8 space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-md border p-5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

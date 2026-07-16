import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionBankLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <div className="mb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-8 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-2/3" />
      </div>
      <div className="mx-auto max-w-2xl space-y-5">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="rounded-lg border p-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-3/4" />
          <Skeleton className="mt-6 h-28 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

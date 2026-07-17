import { Skeleton } from "@/components/ui/skeleton";

export default function ChatbotLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-8 md:px-10">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-8 space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-1/2" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-24 w-3/4" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-2/5" />
        </div>
      </div>
    </div>
  );
}

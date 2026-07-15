import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-soft sm:rounded-3xl sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full sm:h-12 sm:w-12" />

        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24 sm:w-32" />
          <Skeleton className="h-3 w-16 sm:w-20" />
        </div>

        <Skeleton className="h-7 w-16 rounded-full sm:w-20" />
      </div>

      {/* Content */}
      <div className="mt-5 space-y-3">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Image placeholder */}
      <Skeleton className="mt-5 aspect-[4/3] w-full rounded-2xl" />

      {/* Action buttons */}
      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <Skeleton className="h-10 rounded-xl sm:h-11 sm:rounded-2xl" />
        <Skeleton className="h-10 rounded-xl sm:h-11 sm:rounded-2xl" />
        <Skeleton className="h-10 rounded-xl sm:h-11 sm:rounded-2xl" />
      </div>
    </div>
  );
}
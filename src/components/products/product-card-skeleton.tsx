import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden shadow-xs p-3 space-y-3">
      {/* Product Image Skeleton with floating badge outlines */}
      <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden">
        <Skeleton className="w-full h-full rounded-2xl" />
        {/* Floating Condition Pill Outline */}
        <div className="absolute top-2.5 left-2.5">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        {/* Floating Save Heart Outline */}
        <div className="absolute top-2.5 right-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Product Meta */}
      <div className="space-y-2 p-1">
        {/* Category & Time */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-3 w-12 rounded-md" />
        </div>

        {/* Title */}
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-3.5 w-3/5 rounded-md" />

        {/* Pickup Spot */}
        <div className="pt-0.5">
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>

        {/* Price & Savings */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-4 w-10 rounded-md" />
          </div>
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>

        {/* Seller Trust Bar */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3.5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

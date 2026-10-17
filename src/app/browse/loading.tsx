import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/products/product-card-skeleton";

export default function BrowseLoading() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      <div className="bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border-subtle)] space-y-6">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div>
          <ProductGridSkeleton count={9} />
        </div>
      </div>
    </div>
  );
}

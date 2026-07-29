import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-(--breakpoint-xl) mx-auto w-full px-4 lg:px-12 py-10">
      <Skeleton className="h-9 w-56 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <Skeleton className="h-96 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

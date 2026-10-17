import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-6">
      <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-3xl shadow-xs overflow-hidden flex h-[calc(100vh-9rem)] min-h-[500px] w-full">
        {/* Left sidebar skeleton */}
        <div className="w-full md:w-80 shrink-0 border-r border-[var(--border-subtle)] p-4 space-y-4">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-36 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right chat window skeleton */}
        <div className="hidden md:flex flex-1 flex-col p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-subtle)]">
            <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
          </div>
          <div className="flex-1 space-y-4 pt-4">
            <Skeleton className="h-12 w-64 rounded-2xl" />
            <Skeleton className="h-14 w-80 rounded-2xl ml-auto" />
            <Skeleton className="h-10 w-56 rounded-2xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-xl bg-[var(--border-subtle)]/70",
        className
      )}
    />
  );
}

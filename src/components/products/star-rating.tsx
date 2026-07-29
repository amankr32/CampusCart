import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = "sm",
  showCount = true,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
}) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (showCount && !count) {
    return <span className="text-xs text-black/40">No reviews yet</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              iconSize,
              index < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-black/20"
            )}
            strokeWidth={1.5}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs text-black/50">
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}

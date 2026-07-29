"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitReviewAction } from "@/lib/actions/reviews";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Pick a star rating.");
      return;
    }

    setIsSubmitting(true);
    const result = await submitReviewAction({ productId, rating, description });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
    router.refresh();
  };

  if (submitted) {
    return (
      <p className="text-sm text-black/60 p-4 rounded-lg border-2 border-black bg-white">
        Thanks for your review!
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 p-4 rounded-lg border-2 border-black bg-white"
    >
      <p className="font-medium text-sm">Leave a review</p>

      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${value} stars`}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  value <= (hoverRating || rating)
                    ? "fill-[var(--brand-yellow)] text-black"
                    : "fill-transparent text-black/20"
                )}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>

      <textarea
        rows={3}
        placeholder="How was it? (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--shadow-cartoon-sm)]"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="submit"
        variant="elevated"
        size="sm"
        disabled={isSubmitting}
        className="self-start"
      >
        {isSubmitting ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}

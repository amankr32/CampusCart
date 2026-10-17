"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "@/components/ui/material-symbol";

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
      <p className="text-sm text-emerald-500 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 font-medium">
        Thanks for your review!
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-xs"
    >
      <p className="font-semibold text-sm text-[var(--text-primary)]">Leave a review</p>

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
              className="cursor-pointer"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  value <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-[var(--text-muted)]/40"
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
        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] px-3 py-2 text-sm outline-hidden focus:border-[var(--brand-primary)] placeholder:text-[var(--text-muted)]/50"
      />

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

      <Button
        type="submit"
        size="sm"
        disabled={isSubmitting}
        className="self-start rounded-xl text-xs font-semibold"
      >
        {isSubmitting ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}

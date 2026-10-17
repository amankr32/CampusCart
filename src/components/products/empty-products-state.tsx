"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchX, Sparkles, RefreshCw, PlusCircle, Compass } from "@/components/ui/material-symbol";
import { Button } from "@/components/ui/button";

export function EmptyProductsState({
  search,
  category,
  minPrice,
  maxPrice,
  condition,
}: {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string | string[];
}) {
  const router = useRouter();

  const hasFilters = Boolean(
    search || category || minPrice || maxPrice || condition
  );

  // Dynamic friendly heading based on active filters
  let heading = "No listings found";
  if (search && maxPrice) {
    heading = `No "${search}" found under ₹${maxPrice}`;
  } else if (search && minPrice) {
    heading = `No "${search}" found above ₹${minPrice}`;
  } else if (search) {
    heading = `No listings found for "${search}"`;
  } else if (maxPrice) {
    heading = `No items found under ₹${maxPrice}`;
  } else if (category) {
    heading = `No listings currently in this category`;
  } else if (hasFilters) {
    heading = "No items match your selected filters";
  }

  const handleReset = () => {
    router.push("/browse");
  };

  const trendingTags = [
    { label: "Casio fx-991", search: "Casio fx-991" },
    { label: "Engineering Maths", search: "Engineering Mathematics" },
    { label: "Mini Drafter", search: "Drafter" },
    { label: "Hostel Mattress", search: "Mattress" },
    { label: "Cycle", search: "Cycle" },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-xs space-y-6">
      {/* Friendly Icon with ambient glow & sparkle */}
      <div className="relative">
        <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 shadow-md shadow-indigo-500/10">
          <SearchX className="h-10 w-10 stroke-[1.75]" />
        </div>
        <span className="absolute -top-1 -right-1 flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-xs">
          <Sparkles className="h-4 w-4" />
        </span>
      </div>

      {/* Copy */}
      <div className="space-y-2 max-w-md">
        <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight">
          {heading}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          {hasFilters
            ? "Try broadening your keywords, relaxing price boundaries, or post a request so students in your hostel can reach out."
            : "Be the first student to post an item in this category or check back later!"}
        </p>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {hasFilters && (
          <Button
            onClick={handleReset}
            variant="outline"
            className="rounded-2xl text-xs font-bold px-5 h-11 border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]/50 hover:bg-[var(--border-subtle)]/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset all filters
          </Button>
        )}

        <Link href="/sell">
          <Button className="rounded-2xl text-xs font-bold px-5 h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95">
            <PlusCircle className="h-4 w-4" />
            Post a Listing
          </Button>
        </Link>

        {!hasFilters && (
          <Link href="/browse">
            <Button
              variant="outline"
              className="rounded-2xl text-xs font-bold px-5 h-11 border-[var(--border-subtle)] flex items-center gap-2"
            >
              <Compass className="h-4 w-4" />
              Explore All Categories
            </Button>
          </Link>
        )}
      </div>

      {/* Popular Trending Suggestions Pill Chips */}
      <div className="pt-4 border-t border-[var(--border-subtle)]/70 w-full max-w-lg">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
          Or try popular campus searches:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {trendingTags.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => router.push(`/browse?search=${encodeURIComponent(tag.search)}`)}
              className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)] transition-all cursor-pointer"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

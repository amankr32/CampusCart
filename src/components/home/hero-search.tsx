"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, X, Sparkles } from "@/components/ui/material-symbol";

import { openCommandPalette } from "@/lib/command-palette";

const TRENDING_TAGS = [
  { label: "1st Year Books", icon: "📚", query: "1st year books" },
  { label: "Drafter", icon: "📐", query: "drafter" },
  { label: "Hercules Cycle", icon: "🚲", query: "cycle" },
  { label: "Casio fx-991CW", icon: "⚡", query: "casio fx-991" },
  { label: "Mattress & Hostel", icon: "🛏️", query: "hostel" },
];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      router.push("/browse");
      return;
    }
    router.push(`/browse?search=${encodeURIComponent(query.trim())}`);
  };

  const handleTagClick = (tagQuery: string) => {
    router.push(`/browse?search=${encodeURIComponent(tagQuery)}`);
  };

  return (
    <div className="w-full space-y-3">
      {/* Clean Human-Friendly Search Bar */}
      <form
        onSubmit={handleSubmit}
        className="group relative flex items-center w-full rounded-2xl bg-[var(--card-bg)] border-2 border-[var(--border-subtle)] focus-within:border-[var(--brand-primary)] shadow-sm hover:shadow-md transition-all duration-200 p-1.5"
      >
        <div className="flex items-center justify-center pl-3.5 pr-2 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors">
          <Search className="h-5 w-5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books, drafters, calculators (fx-991), cycles..."
          className="flex-1 bg-transparent px-2 py-2.5 text-sm sm:text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 focus:outline-hidden"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="p-1.5 mr-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--border-subtle)]/50"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Hotkey hint (opens universal Command Palette) */}
        <button
          type="button"
          onClick={() => openCommandPalette(query)}
          className="hidden sm:flex items-center gap-1 mr-2 px-2 py-1 rounded-md bg-[var(--border-subtle)]/40 hover:bg-[var(--border-subtle)]/80 border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)] cursor-pointer transition-colors"
          title="Open Search Palette (⌘K)"
        >
          <span>⌘</span>
          <span>K</span>
        </button>

        {/* Search Submit CTA */}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <span>Search</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Popular Campus Search Pills */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        <span className="text-xs font-medium text-[var(--text-muted)] shrink-0">
          Popular:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {TRENDING_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => handleTagClick(tag.query)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50 text-[var(--text-primary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]/40 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

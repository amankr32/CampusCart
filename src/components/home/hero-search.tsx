"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "@/components/ui/material-symbol";

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

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Figma FlipEarn Centered Pill Search Bar */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full rounded-2xl bg-white border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-xs transition-all p-1 sm:p-1.5"
      >
        <div className="flex items-center justify-center pl-2.5 sm:pl-3 pr-1 text-slate-400 shrink-0">
          <Search className="h-4.5 w-4.5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books, calculators, hostel gear..."
          className="min-w-0 flex-1 bg-transparent px-2 sm:px-2.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="p-1 mr-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <button
          type="submit"
          className="inline-flex items-center justify-center px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer border-0"
        >
          Search
        </button>
      </form>
    </div>
  );
}

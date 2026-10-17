"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  History,
  Compass,
  Plus,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Trash2,
  Package,
} from "@/components/ui/material-symbol";

import {
  closeCommandPalette,
  openCommandPalette,
  subscribeToCommandPalette,
} from "@/lib/command-palette";
import { formatPrice, CONDITION_LABELS } from "@/lib/format";
import type { QuickSearchResult } from "@/db/queries/products";

const DEFAULT_RECENT_SEARCHES = [
  "Engineering Mathematics",
  "Casio fx-991",
  "Hercules Cycle",
  "Engineering Drafter",
];

const POPULAR_CATEGORIES = [
  { label: "Textbooks", icon: "📚", slug: "textbooks" },
  { label: "Electronics", icon: "💻", slug: "electronics" },
  { label: "Bicycles", icon: "🚲", slug: "bicycles" },
  { label: "Hostel Gear", icon: "🛏️", slug: "hostel" },
  { label: "Lab & Tools", icon: "📐", slug: "tools" },
];

export function CommandPalette() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to command palette open/close events
  useEffect(() => {
    const unsubscribe = subscribeToCommandPalette((open, initialQuery) => {
      setIsOpen(open);
      if (open) {
        setQuery(initialQuery || "");
        setHighlightedIndex(-1);
      }
    });
    return unsubscribe;
  }, []);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCommandPalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("campuscart_recent_searches");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentSearches(parsed.slice(0, 5));
          return;
        }
      }
    } catch {
      // fallback
    }
    setRecentSearches(DEFAULT_RECENT_SEARCHES);
  }, []);

  // Focus input and lock body scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = "";
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Debounced search when query changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data.results) ? data.results : []);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
        setHighlightedIndex(-1);
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem("campuscart_recent_searches", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem("campuscart_recent_searches");
    } catch {
      // ignore
    }
  };

  const navigateTo = (url: string, searchToSave?: string) => {
    if (searchToSave) {
      saveRecentSearch(searchToSave);
    }
    closeCommandPalette();
    startTransition(() => {
      router.push(url);
    });
  };

  // Keyboard navigation within the modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeCommandPalette();
      return;
    }

    // Total actionable items when query is present: "Search for..." action + results
    const totalItems = query.trim() ? results.length + 1 : 0;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalItems > 0) {
        setHighlightedIndex((prev) => (prev + 1) % totalItems);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalItems > 0) {
        setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim()) {
        if (highlightedIndex <= 0) {
          // Top action: Search all for query
          navigateTo(`/browse?search=${encodeURIComponent(query.trim())}`, query.trim());
        } else {
          const product = results[highlightedIndex - 1];
          if (product) {
            navigateTo(`/product/${product.slug}`, product.name);
          }
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search CampusCart marketplace"
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-3 sm:px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => closeCommandPalette()}
    >
      <div
        className="relative w-full max-w-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--card-bg)] shrink-0">
          <Search className="w-5 h-5 text-[var(--brand-primary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search textbooks, calculators, drafters, cycles, hostel gear..."
            className="flex-1 bg-transparent text-sm sm:text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-subtle)]/50 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--border-subtle)]/50 rounded-md border border-[var(--border-subtle)]">
            ESC
          </kbd>

          <button
            type="button"
            onClick={() => closeCommandPalette()}
            className="sm:hidden p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]/50">
          {/* Query Results Section */}
          {query.trim() ? (
            <div className="p-2 space-y-1">
              {/* Top Action: Search All Listings for "{query}" */}
              <button
                type="button"
                onClick={() => navigateTo(`/browse?search=${encodeURIComponent(query.trim())}`, query.trim())}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  highlightedIndex === 0
                    ? "bg-[var(--brand-primary-light)] text-[var(--brand-primary)]"
                    : "hover:bg-[var(--border-subtle)]/40 text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                    <Search className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold">
                      Search all listings for &ldquo;<span className="text-[var(--brand-primary)]">{query.trim()}</span>&rdquo;
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">Press Enter to view full marketplace filters</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
              </button>

              {/* Live Matching Items */}
              {isLoading ? (
                <div className="p-8 text-center space-y-2">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
                  <p className="text-xs text-[var(--text-muted)]">Searching campus listings...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="pt-2">
                  <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                    <span>Products ({results.length})</span>
                    <span>Direct item match</span>
                  </div>

                  {results.map((product, idx) => {
                    const isSelected = highlightedIndex === idx + 1;
                    const conditionText = CONDITION_LABELS[product.condition] || product.condition;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => navigateTo(`/product/${product.slug}`, product.name)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shadow-xs"
                            : "hover:bg-[var(--border-subtle)]/40 text-[var(--text-primary)]"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-12 h-12 rounded-lg bg-[var(--border-subtle)]/60 overflow-hidden shrink-0 border border-[var(--border-subtle)] flex items-center justify-center">
                          {product.images && product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-[var(--text-muted)]" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold truncate text-[var(--text-primary)]">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-muted)]">
                            {product.categoryName && <span>{product.categoryName}</span>}
                            {product.categoryName && <span>•</span>}
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {conditionText}
                            </span>
                            {product.hostel && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-0.5 truncate">
                                  <MapPin className="w-3 h-3 text-indigo-500" />
                                  {product.hostel}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold text-[var(--brand-primary)]">
                            {formatPrice(product.priceCents)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 px-4 text-center">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    No exact listings found for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                    Try searching for common terms like textbook, drafter, calculator, cycle, or mattress.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo(`/browse?search=${encodeURIComponent(query.trim())}`, query.trim())}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-semibold shadow-xs hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Search entire catalog
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty Query View: Recents, Categories, and Quick Links */
            <div className="p-4 space-y-5">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-indigo-500" />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs hover:bg-[var(--brand-primary-light)]/30 active:scale-95"
                      >
                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Categories */}
              <div>
                <p className="pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Popular Categories
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POPULAR_CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => navigateTo(`/browse?category=${cat.slug}`)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/60 bg-[var(--card-bg)] hover:bg-[var(--brand-primary-light)]/20 transition-all text-left cursor-pointer group"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform">
                        {cat.icon}
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div>
                <p className="pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Quick Actions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo("/browse")}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)]/40 transition-colors text-left cursor-pointer group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      <Compass className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
                        Browse Marketplace
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">Explore all items by branch & hostel</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/sell")}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)]/40 transition-colors text-left cursor-pointer group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
                        Sell an Item
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">List textbooks or gadgets for campus buyers</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/dashboard/messages")}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)]/40 transition-colors text-left cursor-pointer group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <MessageSquare className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
                        Campus Messages
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">Direct chat with sellers & buyers</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/student-verification")}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)]/40 transition-colors text-left cursor-pointer group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
                        Student Verification
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">Get verified IKGPTU student badge</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-[var(--card-bg)] border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)]/50 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)]/50 font-mono text-[10px]">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)]/50 font-mono text-[10px]">↵</kbd>
              to select
            </span>
          </div>
          <span>IKGPTU Student Community</span>
        </div>
      </div>
    </div>
  );
}

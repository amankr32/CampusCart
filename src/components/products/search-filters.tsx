"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  ShieldCheck,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CONDITION_LABELS } from "@/lib/format";

const CONDITIONS = Object.keys(CONDITION_LABELS);

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeConditions = searchParams.getAll("condition");
  const activeSort = searchParams.get("sort") ?? "newest";
  const activeFilterCount =
    activeConditions.length +
    (searchParams.get("search") ? 1 : 0) +
    (searchParams.get("minPrice") ? 1 : 0) +
    (searchParams.get("maxPrice") ? 1 : 0);

  const hasActiveFilters =
    activeConditions.length > 0 ||
    Boolean(searchParams.get("search")) ||
    Boolean(searchParams.get("minPrice")) ||
    Boolean(searchParams.get("maxPrice")) ||
    Boolean(searchParams.get("category"));

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        params.delete(key);
        if (value === null) continue;
        if (Array.isArray(value)) {
          for (const v of value) params.append(key, v);
        } else if (value !== "") {
          params.set(key, value);
        }
      }

      params.delete("page"); // any filter change resets pagination

      startTransition(() => {
        router.push(`/browse?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const toggleCondition = (condition: string) => {
    const next = activeConditions.includes(condition)
      ? activeConditions.filter((c) => c !== condition)
      : [...activeConditions, condition];
    updateParams({ condition: next.length > 0 ? next : null });
  };

  const handleClearAll = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    startTransition(() => router.push("/browse"));
  };

  return (
    <div className="space-y-3">
      {/* Mobile Compact Filter Toggle Bar */}
      <div className="lg:hidden flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsMobileOpen((v) => !v)}
          aria-expanded={isMobileOpen}
          className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-2xl border border-slate-200 bg-white shadow-xs text-xs font-bold text-slate-900 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <span>Filters &amp; Sort</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">
                {activeFilterCount}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span>{SORT_OPTIONS.find((s) => s.value === activeSort)?.label ?? "Sort"}</span>
            {isMobileOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-blue-600 hover:bg-blue-50 shrink-0 cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      <div
        className={cn(
          isMobileOpen ? "flex" : "hidden lg:flex",
          "flex-col gap-5 p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs h-fit transition-opacity",
          isPending && "opacity-60"
        )}
      >
      {/* Filters Header (FlipEarn Figma sidebar header) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-blue-600" />
          <h2 className="font-display font-bold text-slate-900 text-base">
            Filters
          </h2>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Search Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ search });
        }}
        className="flex flex-col gap-2"
      >
        <Label htmlFor="search" className="text-xs font-bold text-slate-700">
          Search Keyword
        </Label>
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            id="search"
            placeholder="Textbooks, drafter, cycle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 h-10 text-xs rounded-xl border-slate-200 bg-slate-50/70 focus-visible:border-blue-600 focus-visible:ring-blue-500/20"
          />
        </div>
      </form>

      {/* Sort By Selector */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-bold text-slate-700">
          Sort by
        </Label>
        <select
          value={activeSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 px-3 text-xs outline-hidden focus-visible:border-blue-600 cursor-pointer font-medium"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-white text-slate-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Condition Filter */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
        <Label className="text-xs font-bold text-slate-700">
          Item Condition
        </Label>
        <div className="flex flex-col gap-2">
          {CONDITIONS.map((condition) => {
            const isChecked = activeConditions.includes(condition);
            return (
              <label
                key={condition}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border",
                  isChecked
                    ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                    : "border-slate-100 text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCondition(condition)}
                    className="h-4 w-4 rounded-md accent-blue-600 cursor-pointer"
                  />
                  <span>{CONDITION_LABELS[condition]}</span>
                </div>
                {isChecked && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ minPrice, maxPrice });
        }}
        className="flex flex-col gap-2.5 pt-2 border-t border-slate-100"
      >
        <Label className="text-xs font-bold text-slate-700">
          Price range (₹)
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <Input
              type="number"
              min={0}
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="pl-6 h-9 text-xs rounded-xl border-slate-200 bg-slate-50/70"
            />
          </div>
          <span className="text-slate-400 text-xs font-bold">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
            <Input
              type="number"
              min={0}
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="pl-6 h-9 text-xs rounded-xl border-slate-200 bg-slate-50/70"
            />
          </div>
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="mt-1 h-8 rounded-xl text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
        >
          Apply Price
        </Button>
      </form>

      {/* Student Safety Badge inside Sidebar */}
      <div className="pt-3 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <p className="font-bold text-emerald-800">IKGPTU Campus Verified</p>
            <p className="text-emerald-700/80 text-[10px] mt-0.5">
              Only verified university students can list or chat.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

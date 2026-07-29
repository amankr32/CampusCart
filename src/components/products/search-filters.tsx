"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

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

  const activeConditions = searchParams.getAll("condition");
  const activeSort = searchParams.get("sort") ?? "newest";

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

  return (
    <div
      className={cn(
        "flex flex-col gap-6 p-5 rounded-xl border border-[var(--border-subtle)] bg-white shadow-[var(--shadow-card)] h-fit",
        isPending && "opacity-60"
      )}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ search });
        }}
        className="flex flex-col gap-2"
      >
        <Label htmlFor="search">Search</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="elevated" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <Label>Sort by</Label>
        <select
          value={activeSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="h-10 rounded-lg border border-[var(--border-subtle)] bg-white px-3 text-sm outline-none focus-visible:border-[var(--brand-orange)]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Condition</Label>
        <div className="flex flex-col gap-2">
          {CONDITIONS.map((condition) => (
            <label
              key={condition}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={activeConditions.includes(condition)}
                onChange={() => toggleCondition(condition)}
                className="h-4 w-4 accent-[var(--brand-orange)]"
              />
              {CONDITION_LABELS[condition]}
            </label>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ minPrice, maxPrice });
        }}
        className="flex flex-col gap-2"
      >
        <Label>Price range (₹)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-black/40">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <Button type="submit" variant="ghost" size="sm" className="self-start">
          Apply
        </Button>
      </form>

      {(activeConditions.length > 0 ||
        searchParams.get("search") ||
        searchParams.get("minPrice") ||
        searchParams.get("maxPrice") ||
        searchParams.get("category")) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            setMinPrice("");
            setMaxPrice("");
            startTransition(() => router.push("/browse"));
          }}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}

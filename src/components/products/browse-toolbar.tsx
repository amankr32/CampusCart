"use client";

import { useState } from "react";
import { LayoutGrid, List } from "@/components/ui/material-symbol";

import { ProductGrid } from "@/components/products/product-grid";
import type { ProductListItem } from "@/db/queries/products";

export function BrowseResults({
  products,
  totalCount,
  filterParams,
}: {
  products: ProductListItem[];
  totalCount: number;
  filterParams?: {
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string | string[];
  };
}) {
  const [view, setView] = useState<"grid" | "list">("grid");

  if (products.length === 0) {
    return <ProductGrid products={products} view={view} filterParams={filterParams} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--text-muted)]">
          Showing {products.length} of {totalCount} item{totalCount === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] p-1 bg-[var(--card-bg)]">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all cursor-pointer ${
              view === "grid"
                ? "bg-[var(--brand-primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all cursor-pointer ${
              view === "list"
                ? "bg-[var(--brand-primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ProductGrid products={products} view={view} filterParams={filterParams} />
    </div>
  );
}
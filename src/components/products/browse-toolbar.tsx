"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import { ProductGrid } from "@/components/products/product-grid";
import type { ProductListItem } from "@/db/queries/products";

export function BrowseResults({
  products,
  totalCount,
}: {
  products: ProductListItem[];
  totalCount: number;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-black/50">
          Showing {products.length} of {totalCount} item{totalCount === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] p-1 bg-white">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors ${
              view === "grid"
                ? "bg-[var(--brand-orange)] text-white"
                : "text-black/50 hover:text-black"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors ${
              view === "list"
                ? "bg-[var(--brand-orange)] text-white"
                : "text-black/50 hover:text-black"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ProductGrid products={products} view={view} />
    </div>
  );
}
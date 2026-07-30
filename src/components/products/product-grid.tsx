import { PackageSearch } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import type { ProductListItem } from "@/db/queries/products";

export function ProductGrid({
  products,
  view = "grid",
}: {
  products: ProductListItem[];
  view?: "grid" | "list";
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center border-2 border-dashed border-black/20 rounded-lg">
        <PackageSearch className="h-10 w-10 text-black/30" />
        <p className="font-medium">No listings match your filters</p>
        <p className="text-sm text-black/50 max-w-xs">
          Try widening your price range or clearing a filter or two.
        </p>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} view="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} view="grid" />
      ))}
    </div>
  );
}
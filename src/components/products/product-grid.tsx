import { ProductCard } from "@/components/products/product-card";
import { EmptyProductsState } from "@/components/products/empty-products-state";
import type { ProductListItem } from "@/db/queries/products";

export function ProductGrid({
  products,
  view = "grid",
  filterParams,
}: {
  products: ProductListItem[];
  view?: "grid" | "list";
  filterParams?: {
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string | string[];
  };
}) {
  if (products.length === 0) {
    return <EmptyProductsState {...filterParams} />;
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
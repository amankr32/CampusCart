import type { Metadata } from "next";

import { getProducts, type ProductSort } from "@/db/queries/products";
import { ProductGrid } from "@/components/products/product-grid";
import { SearchFilters } from "@/components/products/search-filters";
import { CategoryPills } from "@/components/products/category-pills";
import { ProductPagination } from "@/components/products/pagination";

export const metadata: Metadata = {
  title: "Browse listings — Campus Cart",
  description:
    "Browse textbooks, hostel essentials, cycles, electronics, and more listed by IK Gujral Punjab University students.",
};

type SearchParams = Promise<{
  search?: string;
  category?: string;
  condition?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}>;

const VALID_SORTS: ProductSort[] = ["newest", "price_asc", "price_desc"];

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const conditions = params.condition
    ? Array.isArray(params.condition)
      ? params.condition
      : [params.condition]
    : undefined;

  const sort = VALID_SORTS.includes(params.sort as ProductSort)
    ? (params.sort as ProductSort)
    : "newest";

  const page = params.page ? Number(params.page) || 1 : 1;

  const { docs, totalPages, page: currentPage } = await getProducts({
    search: params.search,
    categorySlug: params.category,
    conditions,
    minPriceRupees: params.minPrice ? Number(params.minPrice) : undefined,
    maxPriceRupees: params.maxPrice ? Number(params.maxPrice) : undefined,
    sort,
    page,
  });

  return (
    <div className="w-full px-4 lg:px-12 py-10">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl mb-4">
          Browse listings
        </h1>
        <CategoryPills activeCategorySlug={params.category} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SearchFilters />
        </aside>

        <div>
          <ProductGrid products={docs} />
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            searchParams={params}
          />
        </div>
      </div>
    </div>
  );
}

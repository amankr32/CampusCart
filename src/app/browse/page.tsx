import type { Metadata } from "next";
import { ShieldCheck, MapPin, IndianRupee, MessageCircle } from "lucide-react";

import { getProducts, type ProductSort } from "@/db/queries/products";
import { SearchFilters } from "@/components/products/search-filters";
import { CategoryPills } from "@/components/products/category-pills";
import { ProductPagination } from "@/components/products/pagination";
import { BrowseResults } from "@/components/products/browse-toolbar";

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

  const { docs, totalCount, totalPages, page: currentPage } = await getProducts({
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
        <h1 className="font-display font-bold text-3xl mb-1">Browse listings</h1>
        <p className="text-black/50 text-sm mb-4">
          Showing {totalCount} item{totalCount === 1 ? "" : "s"}
        </p>
        <CategoryPills activeCategorySlug={params.category} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SearchFilters />
        </aside>

        <div>
          <BrowseResults products={docs} totalCount={totalCount} />
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            searchParams={params}
          />
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-[var(--border-subtle)] pt-8">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-medium">Verified Students</p>
            <p className="text-xs text-black/50">Campus email required</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-medium">Safe Campus Deals</p>
            <p className="text-xs text-black/50">Meet in person on campus</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <IndianRupee className="h-5 w-5 text-orange-600 shrink-0" />
          <div>
            <p className="text-sm font-medium">No Platform Fee</p>
            <p className="text-xs text-black/50">Keep 100% of your earnings</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MessageCircle className="h-5 w-5 text-violet-600 shrink-0" />
          <div>
            <p className="text-sm font-medium">Direct Chat</p>
            <p className="text-xs text-black/50">Chat directly with sellers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
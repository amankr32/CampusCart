import type { Metadata } from "next";
import { ShieldCheck, MapPin, IndianRupee, MessageCircle } from "@/components/ui/material-symbol";

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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600">
            IKGPTU Student Marketplace
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight mt-1">
            Explore Campus Listings
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Browse genuine textbooks, cycles, engineering tools, and hostel essentials listed by verified campus peers.
          </p>
        </div>

        {/* Category Pills Bar */}
        <div className="pt-1">
          <CategoryPills activeCategorySlug={params.category} />
        </div>
      </div>

      {/* Main Browse Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        <aside className="lg:sticky lg:top-24 lg:self-start w-full">
          <SearchFilters />
        </aside>

        <div className="min-w-0 space-y-6">
          <BrowseResults products={docs} totalCount={totalCount} filterParams={params} />
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            searchParams={params}
          />
        </div>
      </div>

      {/* Campus Trust Strip */}
      <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Verified Students</p>
            <p className="text-[11px] text-slate-500">IKGPTU roll check</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Campus Pickups</p>
            <p className="text-[11px] text-slate-500">Hostels &amp; Library</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Zero Brokerage</p>
            <p className="text-[11px] text-slate-500">Keep 100% earnings</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Direct Chat</p>
            <p className="text-[11px] text-slate-500">Instant messaging</p>
          </div>
        </div>
      </div>
    </div>
  );
}
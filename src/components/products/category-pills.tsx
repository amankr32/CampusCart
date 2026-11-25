import Link from "next/link";

import { cn } from "@/lib/utils";
import { getTopLevelCategories } from "@/db/queries/categories";

export async function CategoryPills({
  activeCategorySlug,
}: {
  activeCategorySlug?: string;
}) {
  const categories = await getTopLevelCategories();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0">
      <Link
        href="/browse"
        className={cn(
          "shrink-0 whitespace-nowrap text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-xl border transition-all cursor-pointer",
          !activeCategorySlug
            ? "bg-blue-600 border-blue-600 text-white shadow-xs"
            : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
        )}
      >
        All Items
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/browse?category=${category.slug}`}
          className={cn(
            "shrink-0 whitespace-nowrap text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-xl border transition-all cursor-pointer",
            activeCategorySlug === category.slug
              ? "bg-blue-600 border-blue-600 text-white shadow-xs"
              : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

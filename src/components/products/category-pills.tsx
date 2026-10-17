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
    <div className="flex flex-wrap gap-2">
      <Link
        href="/browse"
        className={cn(
          "text-xs font-bold px-4 py-2 rounded-xl border transition-all",
          !activeCategorySlug
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 border-transparent text-white shadow-xs"
            : "bg-[var(--card-bg)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)]"
        )}
      >
        All Items
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/browse?category=${category.slug}`}
          className={cn(
            "text-xs font-bold px-4 py-2 rounded-xl border transition-all",
            activeCategorySlug === category.slug
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 border-transparent text-white shadow-xs"
              : "bg-[var(--card-bg)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)]"
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

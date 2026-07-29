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
          "text-sm font-medium px-4 py-2 rounded-full border transition-colors",
          !activeCategorySlug
            ? "bg-[var(--brand-orange)] border-[var(--brand-orange)] text-white"
            : "bg-white border-[var(--border-subtle)] hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)]"
        )}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/browse?category=${category.slug}`}
          className={cn(
            "text-sm font-medium px-4 py-2 rounded-full border transition-colors",
            activeCategorySlug === category.slug
              ? "bg-[var(--brand-orange)] border-[var(--brand-orange)] text-white"
              : "bg-white border-[var(--border-subtle)] hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)]"
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

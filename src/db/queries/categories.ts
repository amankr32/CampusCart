import "server-only";
import { eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { categories } from "@/db/schema";

export async function getTopLevelCategories() {
  return db
    .select()
    .from(categories)
    .where(isNull(categories.parentId))
    .orderBy(categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return category;
}

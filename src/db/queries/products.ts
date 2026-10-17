import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import { categories, orders, products, reviews, tenants, users } from "@/db/schema";

export const PRODUCTS_PAGE_SIZE = 12;

export type ProductSort = "newest" | "price_asc" | "price_desc";

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  conditions?: string[];
  minPriceRupees?: number;
  maxPriceRupees?: number;
  hostel?: string;
  sort?: ProductSort;
  page?: number;
  tenantSlug?: string;
}

function buildWhereClause(filters: ProductFilters): SQL | undefined {
  const clauses: SQL[] = [eq(products.isArchived, false)];

  if (filters.search && filters.search.trim()) {
    const rawSearch = filters.search.trim();
    const searchTerms = rawSearch.split(/\s+/).filter(Boolean);

    // 1. PostgreSQL Full-Text Search (inflections & stemming e.g. calculator <-> calculating)
    const ftsClause = sql`to_tsvector('english', coalesce(${products.name}, '') || ' ' || coalesce(${products.description}, '')) @@ plainto_tsquery('english', ${rawSearch})`;

    // 2. Multi-field substring search across name, description, and tags
    const termClauses = searchTerms.map((term) => {
      const pattern = `%${term}%`;
      return or(
        ilike(products.name, pattern),
        ilike(products.description, pattern),
        sql`${products.tags}::text ILIKE ${pattern}`
      );
    });

    clauses.push(
      or(
        ftsClause,
        termClauses.length > 0 ? and(...termClauses) : undefined
      )!
    );
  }

  if (filters.conditions && filters.conditions.length > 0) {
    clauses.push(
      inArray(
        products.condition,
        filters.conditions as (typeof products.condition.enumValues)[number][]
      )
    );
  }

  if (typeof filters.minPriceRupees === "number") {
    clauses.push(gte(products.priceCents, filters.minPriceRupees * 100));
  }

  if (typeof filters.maxPriceRupees === "number") {
    clauses.push(lte(products.priceCents, filters.maxPriceRupees * 100));
  }

  if (filters.hostel) {
    clauses.push(eq(products.hostel, filters.hostel));
  }

  return and(...clauses);
}

/**
 * Fetches a page of products matching the given filters, joined with their
 * tenant (store) and category, plus review stats computed in ONE grouped
 * query for the whole page — not one query per product.
 */
export async function getProducts(filters: ProductFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * PRODUCTS_PAGE_SIZE;

  // Resolve category slug -> id first, since the where clause filters by id.
  let categoryId: string | undefined;
  if (filters.categorySlug) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, filters.categorySlug))
      .limit(1);
    categoryId = category?.id;

    // No matching category means no results — short-circuit.
    if (!categoryId) {
      return { docs: [], totalCount: 0, page, totalPages: 0 };
    }
  }

  let tenantId: string | undefined;
  if (filters.tenantSlug) {
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, filters.tenantSlug))
      .limit(1);
    tenantId = tenant?.id;

    if (!tenantId) {
      return { docs: [], totalCount: 0, page, totalPages: 0 };
    }
  }

  const baseWhere = buildWhereClause(filters);
  const whereClause = and(
    baseWhere,
    categoryId ? eq(products.categoryId, categoryId) : undefined,
    tenantId ? eq(products.tenantId, tenantId) : undefined
  );

  const hasSearch = Boolean(filters.search && filters.search.trim());
  const orderBy =
    filters.sort === "price_asc"
      ? [asc(products.priceCents)]
      : filters.sort === "price_desc"
        ? [desc(products.priceCents)]
        : hasSearch
          ? [
              desc(
                sql`ts_rank(to_tsvector('english', coalesce(${products.name}, '') || ' ' || coalesce(${products.description}, '')), plainto_tsquery('english', ${filters.search!.trim()}))`
              ),
              desc(products.createdAt),
            ]
          : [desc(products.createdAt)];

  const [docsRaw, totalCountResult] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        priceCents: products.priceCents,
        condition: products.condition,
        status: products.status,
        images: products.images,
        hostel: products.hostel,
        createdAt: products.createdAt,
        tenant: {
          id: tenants.id,
          storeName: tenants.storeName,
          slug: tenants.slug,
          imageUrl: tenants.imageUrl,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .innerJoin(tenants, eq(products.tenantId, tenants.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(PRODUCTS_PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause),

  ]);

  const totalCount = totalCountResult[0]?.count ?? 0;

  // Single grouped query for review stats across the whole page of
  // products — avoids the N+1 pattern of one review query per product.
  const productIds = docsRaw.map((doc) => doc.id);
  const reviewStatsByProductId = new Map<
    string,
    { averageRating: number; reviewCount: number }
  >();

  if (productIds.length > 0) {
    const stats = await db
      .select({
        productId: reviews.productId,
        averageRating: sql<number>`avg(${reviews.rating})::float`,
        reviewCount: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(
        and(inArray(reviews.productId, productIds), isNull(reviews.revieweeId))
      )
      .groupBy(reviews.productId);

    for (const row of stats) {
      reviewStatsByProductId.set(row.productId, {
        averageRating: row.averageRating,
        reviewCount: row.reviewCount,
      });
    }
  }

  const docs = docsRaw.map((doc) => ({
    ...doc,
    averageRating: reviewStatsByProductId.get(doc.id)?.averageRating ?? 0,
    reviewCount: reviewStatsByProductId.get(doc.id)?.reviewCount ?? 0,
  }));

  return {
    docs,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / PRODUCTS_PAGE_SIZE),
  };
}

export type ProductListItem = Awaited<
  ReturnType<typeof getProducts>
>["docs"][number];

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getProductsByTenantId(tenantId: string) {
  return db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenantId))
    .orderBy(desc(products.createdAt));
}

export async function getProductById(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return product;
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      priceCents: products.priceCents,
      condition: products.condition,
      status: products.status,
      quantity: products.quantity,
      images: products.images,
      hostel: products.hostel,
      branch: products.branch,
      tags: products.tags,
      createdAt: products.createdAt,
      tenant: {
        id: tenants.id,
        storeName: tenants.storeName,
        slug: tenants.slug,
        imageUrl: tenants.imageUrl,
        ownerId: tenants.ownerId,
      },
      seller: {
        id: users.id,
        name: users.name,
        username: users.username,
        studentStatus: users.studentStatus,
        trustScore: users.trustScore,
        avatarUrl: users.avatarUrl,
        branch: users.branch,
        createdAt: users.createdAt,
      },
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(products)
    .innerJoin(tenants, eq(products.tenantId, tenants.id))
    .innerJoin(users, eq(tenants.ownerId, users.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isArchived, false)))
    .limit(1);

  if (!product) {
    return null;
  }

  const [reviewStats, salesStats] = await Promise.all([
    db
      .select({
        averageRating: sql<number>`avg(${reviews.rating})::float`,
        reviewCount: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, product.id), isNull(reviews.revieweeId))),
    db
      .select({
        completedCount: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, product.tenant.id),
          eq(orders.status, "completed")
        )
      ),
  ]);

  return {
    ...product,
    averageRating: reviewStats?.[0]?.averageRating ?? 0,
    reviewCount: reviewStats?.[0]?.reviewCount ?? 0,
    completedSales: salesStats?.[0]?.completedCount ?? 0,
  };
}

export async function getProductReviews(productId: string) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      description: reviews.description,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), isNull(reviews.revieweeId)))
    .orderBy(desc(reviews.createdAt));
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string
) {
  const [review] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.productId, productId),
        eq(reviews.userId, userId),
        isNull(reviews.revieweeId)
      )
    )
    .limit(1);

  return Boolean(review);
}

/** A seller's rating as a buyer, computed from reviews other sellers left about them. */
export async function getBuyerReputation(userId: string) {
  const [stats] = await db
    .select({
      averageRating: sql<number>`avg(${reviews.rating})::float`,
      reviewCount: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.revieweeId, userId));

  return {
    averageRating: stats?.averageRating ?? 0,
    reviewCount: stats?.reviewCount ?? 0,
  };
}

export async function getReviewForOrder(orderId: string, authorId: string) {
  const [review] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.orderId, orderId), eq(reviews.userId, authorId)))
    .limit(1);

  return Boolean(review);
}

export interface QuickSearchResult {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  condition: string;
  hostel: string | null;
  images: string[];
  categoryName: string | null;
}

export async function searchProductsQuick(
  query: string,
  limit = 8
): Promise<QuickSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const searchTerms = trimmed.split(/\s+/).filter(Boolean);

  const termClauses = searchTerms.map((term) => {
    const pattern = `%${term}%`;
    return or(
      ilike(products.name, pattern),
      ilike(products.description, pattern),
      sql`${products.tags}::text ILIKE ${pattern}`
    );
  });

  const ftsClause = sql`to_tsvector('english', coalesce(${products.name}, '') || ' ' || coalesce(${products.description}, '')) @@ plainto_tsquery('english', ${trimmed})`;

  const whereClause = and(
    eq(products.isArchived, false),
    eq(products.status, "available"),
    or(ftsClause, termClauses.length > 0 ? and(...termClauses) : undefined)
  );

  const results = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      priceCents: products.priceCents,
      condition: products.condition,
      hostel: products.hostel,
      images: products.images,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(
      desc(
        sql`ts_rank(to_tsvector('english', coalesce(${products.name}, '') || ' ' || coalesce(${products.description}, '')), plainto_tsquery('english', ${trimmed}))`
      ),
      desc(products.createdAt)
    )
    .limit(limit);

  return results.map((r) => ({
    ...r,
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
  }));
}

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
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import { categories, products, reviews, tenants } from "@/db/schema";

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

  if (filters.search) {
    clauses.push(ilike(products.name, `%${filters.search}%`));
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

  const orderBy =
    filters.sort === "price_asc"
      ? [asc(products.priceCents)]
      : filters.sort === "price_desc"
        ? [desc(products.priceCents)]
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
      .innerJoin(tenants, eq(products.tenantId, tenants.id))
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
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(products)
    .innerJoin(tenants, eq(products.tenantId, tenants.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isArchived, false)))
    .limit(1);

  if (!product) {
    return null;
  }

  const [reviewStats] = await db
    .select({
      averageRating: sql<number>`avg(${reviews.rating})::float`,
      reviewCount: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, product.id), isNull(reviews.revieweeId)));

  return {
    ...product,
    averageRating: reviewStats?.averageRating ?? 0,
    reviewCount: reviewStats?.reviewCount ?? 0,
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

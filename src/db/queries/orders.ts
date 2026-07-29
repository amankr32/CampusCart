import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { orders, products, tenants, users } from "@/db/schema";

export async function getOrdersByBuyerId(buyerId: string) {
  return db
    .select({
      id: orders.id,
      totalCents: orders.totalCents,
      status: orders.status,
      createdAt: orders.createdAt,
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        images: products.images,
      },
      tenant: {
        storeName: tenants.storeName,
        slug: tenants.slug,
      },
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(tenants, eq(orders.tenantId, tenants.id))
    .where(eq(orders.buyerId, buyerId))
    .orderBy(desc(orders.createdAt));
}

/** A seller's sales — same shape as the buyer's order list, plus who bought it. */
export async function getSalesByTenantId(tenantId: string) {
  return db
    .select({
      id: orders.id,
      totalCents: orders.totalCents,
      status: orders.status,
      createdAt: orders.createdAt,
      buyer: {
        id: users.id,
        name: users.name,
      },
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        images: products.images,
      },
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(users, eq(orders.buyerId, users.id))
    .where(eq(orders.tenantId, tenantId))
    .orderBy(desc(orders.createdAt));
}

/** Used to gate review submission: a buyer can only review products they've actually received. */
export async function hasCompletedOrder(buyerId: string, productId: string) {
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.buyerId, buyerId),
        eq(orders.productId, productId),
        eq(orders.status, "completed")
      )
    )
    .limit(1);

  return Boolean(order);
}

/** The order for this conversation that isn't cancelled, if any (there's at most one at a time). */
export async function getActiveOrderForConversation(conversationId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(eq(orders.conversationId, conversationId), ne(orders.status, "cancelled"))
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);

  return order ?? null;
}

export async function getOrderById(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  return order ?? null;
}

/**
 * Creates the order for a conversation, already seller-confirmed, and
 * reserves the product. Call sites are responsible for verifying the
 * caller is the seller and that no active order already exists.
 */
export async function createSellerConfirmedOrder({
  conversationId,
  buyerId,
  productId,
  tenantId,
  totalCents,
}: {
  conversationId: string;
  buyerId: string;
  productId: string;
  tenantId: string;
  totalCents: number;
}) {
  const [order] = await db
    .insert(orders)
    .values({
      conversationId,
      buyerId,
      productId,
      tenantId,
      totalCents,
      status: "seller_confirmed",
    })
    .returning();

  await db
    .update(products)
    .set({ status: "reserved" })
    .where(eq(products.id, productId));

  return order;
}

export async function completeOrder(orderId: string, productId: string) {
  const [order] = await db
    .update(orders)
    .set({ status: "completed", buyerConfirmedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  await db
    .update(products)
    .set({ status: "sold" })
    .where(eq(products.id, productId));

  return order;
}

export async function cancelOrder(orderId: string, productId: string) {
  const [order] = await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(eq(orders.id, orderId))
    .returning();

  // Only revert the product back to available if it was reserved by this
  // order and hasn't already been sold through some other path.
  await db
    .update(products)
    .set({ status: "available" })
    .where(and(eq(products.id, productId), eq(products.status, "reserved")));

  return order;
}

/** The buyer's most recent completed order for this product — used to link a product review to the order that earned it. */
export async function getCompletedOrderForReview(
  buyerId: string,
  productId: string
) {
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.buyerId, buyerId),
        eq(orders.productId, productId),
        eq(orders.status, "completed")
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);

  return order ?? null;
}

export type ActiveOrder = Awaited<ReturnType<typeof getActiveOrderForConversation>>;

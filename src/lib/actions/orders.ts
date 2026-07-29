"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { products, users } from "@/db/schema";
import { getConversationMembers, sendSystemMessage } from "@/db/queries/messages";
import {
  cancelOrder,
  completeOrder,
  createSellerConfirmedOrder,
  getActiveOrderForConversation,
  getOrderById,
} from "@/db/queries/orders";
import { formatPrice } from "@/lib/format";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

type ConversationLookup =
  | { ok: true; conversation: { id: string; buyerId: string; sellerId: string; productId: string } }
  | { ok: false; error: string };

async function getConversationOrError(
  conversationId: string,
  userId: string
): Promise<ConversationLookup> {
  const conversation = await getConversationMembers(conversationId);
  if (!conversation) {
    return { ok: false, error: "Conversation not found." };
  }
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    return { ok: false, error: "You don't have access to this conversation." };
  }
  return { ok: true, conversation };
}

export async function markAsSoldAction(
  conversationId: string
): Promise<ActionResult<{ orderId: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You need to sign in first." };
  }

  const result = await getConversationOrError(conversationId, session.user.id);
  if (!result.ok) return { success: false, error: result.error };
  const { conversation } = result;

  if (conversation.sellerId !== session.user.id) {
    return {
      success: false,
      error: "Only the seller can mark this as sold.",
    };
  }

  const existingOrder = await getActiveOrderForConversation(conversationId);
  if (existingOrder) {
    return {
      success: false,
      error: "This item has already been marked as sold.",
    };
  }

  const [product] = await db
    .select({
      id: products.id,
      tenantId: products.tenantId,
      priceCents: products.priceCents,
      name: products.name,
      status: products.status,
    })
    .from(products)
    .where(eq(products.id, conversation.productId))
    .limit(1);

  if (!product) {
    return { success: false, error: "Listing not found." };
  }

  if (product.status === "sold") {
    return { success: false, error: "This item has already been sold." };
  }

  const order = await createSellerConfirmedOrder({
    conversationId,
    buyerId: conversation.buyerId,
    productId: product.id,
    tenantId: product.tenantId,
    totalCents: product.priceCents,
  });

  if (!order) {
    return { success: false, error: "Couldn't create the order. Try again." };
  }

  await sendSystemMessage(
    conversationId,
    session.user.id,
    `📦 The seller marked "${product.name}" (${formatPrice(product.priceCents)}) as sold. Waiting for the buyer to confirm they received it.`
  );

  revalidatePath(`/dashboard/messages/${conversationId}`);
  revalidatePath("/dashboard/messages");

  return { success: true, data: { orderId: order.id } };
}

export async function confirmReceiptAction(
  orderId: string,
  received: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You need to sign in first." };
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.buyerId !== session.user.id) {
    return {
      success: false,
      error: "Only the buyer can confirm receipt.",
    };
  }

  if (order.status !== "seller_confirmed") {
    return {
      success: false,
      error: "This order isn't waiting on a confirmation right now.",
    };
  }

  const [buyer] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (received) {
    await completeOrder(orderId, order.productId);
    await sendSystemMessage(
      order.conversationId,
      session.user.id,
      `✅ ${buyer?.name ?? "The buyer"} confirmed they received the item. Order completed — you can both leave a review now.`
    );
  } else {
    await sendSystemMessage(
      order.conversationId,
      session.user.id,
      `⚠️ ${buyer?.name ?? "The buyer"} said they haven't received the item yet. Keep chatting to sort it out, or either of you can cancel the order.`
    );
  }

  revalidatePath(`/dashboard/messages/${order.conversationId}`);
  revalidatePath("/orders");

  return { success: true, data: undefined };
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You need to sign in first." };
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "Order not found." };
  }

  const conversation = await getConversationMembers(order.conversationId);
  if (
    !conversation ||
    (conversation.buyerId !== session.user.id &&
      conversation.sellerId !== session.user.id)
  ) {
    return { success: false, error: "You don't have access to this order." };
  }

  if (order.status === "completed") {
    return { success: false, error: "A completed order can't be cancelled." };
  }
  if (order.status === "cancelled") {
    return { success: false, error: "This order is already cancelled." };
  }

  const [actor] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  await cancelOrder(orderId, order.productId);
  await sendSystemMessage(
    order.conversationId,
    session.user.id,
    `❌ ${actor?.name ?? "Someone"} cancelled the order. The listing is available again.`
  );

  revalidatePath(`/dashboard/messages/${order.conversationId}`);
  revalidatePath("/dashboard/messages");
  revalidatePath("/orders");

  return { success: true, data: undefined };
}

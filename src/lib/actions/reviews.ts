"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { reviews } from "@/db/schema";
import { auth } from "@/auth";
import {
  getCompletedOrderForReview,
  getOrderById,
  hasCompletedOrder,
} from "@/db/queries/orders";
import { getConversationMembers } from "@/db/queries/messages";
import {
  buyerReviewSchema,
  reviewSchema,
  type BuyerReviewInput,
  type ReviewInput,
} from "@/lib/validations/review";

type ActionResult = { success: true } | { success: false; error: string };

export async function submitReviewAction(
  input: ReviewInput
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "You need to sign in first." };
  }

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  // Only buyers who've actually completed an order for this product can
  // review it — checked server-side, never trust the client here.
  const canReview = await hasCompletedOrder(
    session.user.id,
    parsed.data.productId
  );

  if (!canReview) {
    return {
      success: false,
      error: "You can only review items you've purchased.",
    };
  }

  const order = await getCompletedOrderForReview(
    session.user.id,
    parsed.data.productId
  );

  await db
    .insert(reviews)
    .values({
      orderId: order?.id ?? null,
      productId: parsed.data.productId,
      userId: session.user.id,
      rating: parsed.data.rating,
      description: parsed.data.description || null,
    })
    .onConflictDoNothing({
      target: [reviews.orderId, reviews.userId],
    });

  revalidatePath("/product");

  return { success: true };
}

/** A seller reviewing the buyer on a completed order — separate from the product's own star rating. */
export async function submitBuyerReviewAction(
  input: BuyerReviewInput
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "You need to sign in first." };
  }

  const parsed = buyerReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const order = await getOrderById(parsed.data.orderId);
  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.status !== "completed") {
    return {
      success: false,
      error: "You can only rate a buyer once the order is completed.",
    };
  }

  const conversation = await getConversationMembers(order.conversationId);
  if (!conversation || conversation.sellerId !== session.user.id) {
    return { success: false, error: "Only the seller can rate the buyer." };
  }

  await db
    .insert(reviews)
    .values({
      orderId: order.id,
      productId: order.productId,
      userId: session.user.id,
      revieweeId: order.buyerId,
      rating: parsed.data.rating,
      description: parsed.data.description || null,
    })
    .onConflictDoNothing({
      target: [reviews.orderId, reviews.userId],
    });

  revalidatePath(`/dashboard/messages/${order.conversationId}`);

  return { success: true };
}

"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, products, studentVerifications, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    throw new Error("Unauthorized: Admin privileges required.");
  }
  return session.user;
}

/**
 * Update a student's verification status
 */
export async function adminUpdateUserStudentStatusAction(
  userId: string,
  status: "unverified" | "pending" | "verified" | "rejected",
  reason?: string
) {
  try {
    await requireAdmin();

    await db
      .update(users)
      .set({
        studentStatus: status,
        trustScore: status === "verified" ? 85 : status === "rejected" ? 20 : 50,
        rejectionReason: status === "rejected" ? reason || "Admin declined verification" : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Also update any pending studentVerification records for this user
    if (status === "verified" || status === "rejected") {
      const pendingRequests = await db
        .select()
        .from(studentVerifications)
        .where(eq(studentVerifications.userId, userId))
        .orderBy(desc(studentVerifications.createdAt))
        .limit(1);

      if (pendingRequests.length > 0) {
        await db
          .update(studentVerifications)
          .set({
            status: status === "verified" ? "approved" : "rejected",
            rejectionReason: status === "rejected" ? reason || "Declined by admin" : null,
            updatedAt: new Date(),
          })
          .where(eq(studentVerifications.id, pendingRequests[0].id));
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/verifications");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Grant or revoke Admin privileges
 */
export async function adminToggleUserRoleAction(userId: string, makeAdmin: boolean) {
  try {
    const adminUser = await requireAdmin();

    if (adminUser.id === userId && !makeAdmin) {
      return { success: false, error: "You cannot revoke your own administrator role." };
    }

    await db
      .update(users)
      .set({
        isAdmin: makeAdmin,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Change product/listing status (Available / Sold / Hidden)
 */
export async function adminUpdateProductStatusAction(
  productId: string,
  status: "available" | "sold" | "hidden"
) {
  try {
    await requireAdmin();

    await db
      .update(products)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    revalidatePath("/admin");
    revalidatePath("/browse");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Permanently archive or delete an inappropriate listing
 */
export async function adminDeleteProductAction(productId: string) {
  try {
    await requireAdmin();

    await db
      .update(products)
      .set({
        isArchived: true,
        status: "hidden",
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    revalidatePath("/admin");
    revalidatePath("/browse");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Update order status
 */
export async function adminUpdateOrderStatusAction(
  orderId: string,
  status: "seller_confirmed" | "completed" | "cancelled"
) {
  try {
    await requireAdmin();

    await db
      .update(orders)
      .set({
        status,
        ...(status === "completed" ? { buyerConfirmedAt: new Date() } : {}),
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/admin");
    revalidatePath("/orders");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

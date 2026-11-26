"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  users,
  tenants,
  products,
  studentVerifications,
  orders,
  conversations,
  messages,
  reports,
  verificationCodes,
  passwordResetTokens,
  auditLogs,
} from "@/db/schema";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { logger } from "@/lib/logger";
import { runAtomicBatch } from "@/lib/db-batch";

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

/**
 * Permanently delete a user account and all associated data from the database
 */
export async function adminDeleteUserAction(userId: string) {
  try {
    const adminUser = await requireAdmin();

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    if (adminUser.id === userId) {
      return { success: false, error: "You cannot delete your own administrator account." };
    }

    const blobUrlsToDelete: string[] = [];

    const [targetUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return { success: false, error: "User account not found." };
    }

    if (targetUser.avatarUrl) {
      blobUrlsToDelete.push(targetUser.avatarUrl);
    }

    // Collect verification proof images
    const userVerifications = await db
      .select({ portalScreenshotUrl: studentVerifications.portalScreenshotUrl })
      .from(studentVerifications)
      .where(eq(studentVerifications.userId, userId));

    for (const v of userVerifications) {
      if (v.portalScreenshotUrl) {
        blobUrlsToDelete.push(v.portalScreenshotUrl);
      }
    }

    // Collect message attachment images for any conversation involving this user
    const userConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)));

    if (userConversations.length > 0) {
      const convIds = userConversations.map((c) => c.id);
      const convMessages = await db
        .select({ image: messages.image })
        .from(messages)
        .where(inArray(messages.conversationId, convIds));

      for (const m of convMessages) {
        if (m.image) {
          blobUrlsToDelete.push(m.image);
        }
      }
    }

    // Clean up storefront orders first (orders.tenantId / orders.productId use ON DELETE RESTRICT)
    const [tenant] = await db
      .select({ id: tenants.id, imageUrl: tenants.imageUrl })
      .from(tenants)
      .where(eq(tenants.ownerId, userId))
      .limit(1);

    let productIds: string[] = [];

    if (tenant) {
      if (tenant.imageUrl) {
        blobUrlsToDelete.push(tenant.imageUrl);
      }

      const tenantProducts = await db
        .select({ id: products.id, images: products.images })
        .from(products)
        .where(eq(products.tenantId, tenant.id));

      productIds = tenantProducts.map((p) => p.id);

      for (const p of tenantProducts) {
        if (Array.isArray(p.images)) {
          for (const img of p.images) {
            if (typeof img === "string") {
              blobUrlsToDelete.push(img);
            }
          }
        }
      }
    }

    await runAtomicBatch(db, (tx) => {
      const queries = [];

      if (tenant) {
        queries.push(tx.delete(orders).where(eq(orders.tenantId, tenant.id)));

        if (productIds.length > 0) {
          queries.push(tx.delete(orders).where(inArray(orders.productId, productIds)));
          queries.push(
            tx
              .delete(reports)
              .where(and(eq(reports.targetType, "product"), inArray(reports.targetId, productIds)))
          );
        }
      }

      // Clean up reports targeting this user and email-keyed auth tokens
      queries.push(
        tx
          .delete(reports)
          .where(and(eq(reports.targetType, "user"), eq(reports.targetId, userId)))
      );
      queries.push(tx.delete(verificationCodes).where(eq(verificationCodes.email, targetUser.email)));
      queries.push(tx.delete(passwordResetTokens).where(eq(passwordResetTokens.email, targetUser.email)));

      // Delete the user (cascades tenants, products, conversations, messages, buyer orders, reviews, etc.)
      queries.push(tx.delete(users).where(eq(users.id, userId)));

      // Record audit log for the admin action
      queries.push(
        tx.insert(auditLogs).values({
          userId: adminUser.id,
          action: "ADMIN_USER_DELETED",
          details: {
            deletedUserId: targetUser.id,
            deletedEmail: targetUser.email,
            deletedName: targetUser.name,
          },
        })
      );

      return queries;
    });

    // Best-effort cleanup of stored Vercel Blob images
    for (const url of new Set(blobUrlsToDelete)) {
      if (url.includes("vercel-storage.com")) {
        try {
          await del(url);
        } catch (e) {
          logger.error("ADMIN_USER_BLOB_DELETE", "Failed to delete blob asset", e, { url });
        }
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/verifications");
    revalidatePath("/browse");
    revalidatePath("/");
    revalidatePath("/orders");

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

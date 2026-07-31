"use server";

import { eq, and, count, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";

import { db } from "@/db";
import { tenants, products, users, auditLogs } from "@/db/schema";
import { auth } from "@/auth";
import { slugify, slugifyWithSuffix } from "@/lib/slugify";
import {
  createStoreSchema,
  productSchema,
  type CreateStoreInput,
  type ProductInput,
} from "@/lib/validations/store";

type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; code?: string };

export async function createStoreAction(
  input: CreateStoreInput
): Promise<ActionResult<{ slug: string }>> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "You need to sign in first." };
  }

  const parsed = createStoreSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const [existing] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.ownerId, session.user.id))
    .limit(1);

  if (existing) {
    return { success: false, error: "You already have a store." };
  }

  const baseSlug = slugify(parsed.data.storeName);
  const [slugTaken] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, baseSlug))
    .limit(1);

  const slug = slugTaken ? slugifyWithSuffix(parsed.data.storeName) : baseSlug;

  await db.insert(tenants).values({
    ownerId: session.user.id,
    storeName: parsed.data.storeName,
    slug,
  });

  revalidatePath("/dashboard");
  revalidatePath("/sell");

  return { success: true, data: { slug } };
}

type OwnedTenantResult =
  | { error: string }
  | { tenant: typeof tenants.$inferSelect; userId: string; user: typeof users.$inferSelect };

async function requireOwnedTenant(): Promise<OwnedTenantResult> {
  const session = await auth();

  if (!session?.user) {
    return { error: "You need to sign in first." };
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) {
    return { error: "User account not found." };
  }

  if (!user.emailVerifiedAt) {
    return { error: "Your email must be verified before you can create listings." };
  }

  let [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, session.user.id))
    .limit(1);

  // Auto-create tenant if not exists for convenience
  if (!tenant) {
    const storeSlug = `${slugify(user.name)}-${user.id.slice(0, 6)}`;
    const [newTenant] = await db
      .insert(tenants)
      .values({
        ownerId: user.id,
        storeName: `${user.name}'s Store`,
        slug: storeSlug,
      })
      .returning();
    tenant = newTenant;
  }

  return { tenant, userId: session.user.id, user };
}

/**
 * Creates a product with unverified student listing limit enforcement (max 2 active listings)
 */
export async function createProductAction(
  input: ProductInput
): Promise<ActionResult<{ slug: string }>> {
  const ownedTenant = await requireOwnedTenant();
  if ("error" in ownedTenant) {
    return { success: false, error: ownedTenant.error };
  }

  // Unverified student listing limit check (Max 2 active listings allowed)
  if (ownedTenant.user.studentStatus !== "verified" && !ownedTenant.user.isAdmin) {
    const [countResult] = await db
      .select({ activeCount: count() })
      .from(products)
      .where(
        and(
          eq(products.tenantId, ownedTenant.tenant.id),
          ne(products.status, "hidden"),
          eq(products.isArchived, false)
        )
      );

    const activeListingsCount = Number(countResult?.activeCount ?? 0);
    if (activeListingsCount >= 2) {
      return {
        success: false,
        error: "Unverified students are limited to 2 active listings. Get Student Verified for unlimited listings!",
        code: "UNVERIFIED_LISTING_LIMIT",
      };
    }
  }

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const baseSlug = slugify(parsed.data.name);
  const [slugTaken] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, baseSlug))
    .limit(1);

  const slug = slugTaken ? slugifyWithSuffix(parsed.data.name) : baseSlug;

  await db.insert(products).values({
    tenantId: ownedTenant.tenant.id,
    categoryId: parsed.data.categoryId || null,
    name: parsed.data.name,
    slug,
    description: parsed.data.description || null,
    priceCents: Math.round(parsed.data.priceRupees * 100),
    condition: parsed.data.condition,
    hostel: parsed.data.hostel || null,
    branch: parsed.data.branch || null,
    quantity: parsed.data.quantity,
    images: parsed.data.images,
    status: "available",
  });

  revalidatePath("/dashboard");
  revalidatePath("/my-listings");
  revalidatePath("/browse");

  return { success: true, data: { slug } };
}

export async function updateProductAction(
  productId: string,
  input: ProductInput
): Promise<ActionResult> {
  const ownedTenant = await requireOwnedTenant();
  if ("error" in ownedTenant) {
    return { success: false, error: ownedTenant.error };
  }

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const result = await db
    .update(products)
    .set({
      categoryId: parsed.data.categoryId || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      priceCents: Math.round(parsed.data.priceRupees * 100),
      condition: parsed.data.condition,
      hostel: parsed.data.hostel || null,
      branch: parsed.data.branch || null,
      quantity: parsed.data.quantity,
      images: parsed.data.images,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(products.id, productId),
        ownedTenant.user.isAdmin
          ? undefined
          : eq(products.tenantId, ownedTenant.tenant.id)
      )
    )
    .returning({ id: products.id });

  if (result.length === 0) {
    return { success: false, error: "Listing not found or access denied." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-listings");
  revalidatePath("/browse");

  return { success: true };
}

/**
 * Permanently deletes a listing and cleans up blob images from storage
 */
export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const ownedTenant = await requireOwnedTenant();
  if ("error" in ownedTenant) {
    return { success: false, error: ownedTenant.error };
  }

  // Fetch product to verify ownership and get images
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    return { success: false, error: "Listing not found." };
  }

  // Authorization check: must be owner or admin
  if (product.tenantId !== ownedTenant.tenant.id && !ownedTenant.user.isAdmin) {
    return { success: false, error: "Unauthorized. You can only delete your own listings." };
  }

  // Permanently delete product record from DB
  await db.delete(products).where(eq(products.id, productId));

  // Clean up blob images from Vercel blob storage asynchronously
  if (Array.isArray(product.images) && product.images.length > 0) {
    for (const imgUrl of product.images) {
      if (typeof imgUrl === "string" && imgUrl.includes("vercel-storage.com")) {
        try {
          await del(imgUrl);
        } catch (e) {
          console.error("Failed to delete blob image:", imgUrl, e);
        }
      }
    }
  }

  // Audit log
  await db.insert(auditLogs).values({
    userId: ownedTenant.userId,
    action: "PRODUCT_DELETED",
    details: { productId, productName: product.name },
  });

  revalidatePath("/dashboard");
  revalidatePath("/my-listings");
  revalidatePath("/browse");

  return { success: true, message: "Listing permanently deleted successfully." };
}

/**
 * Updates product status (available | sold | hidden)
 */
export async function updateProductStatusAction(
  productId: string,
  status: "available" | "reserved" | "sold" | "hidden"
): Promise<ActionResult> {
  const ownedTenant = await requireOwnedTenant();
  if ("error" in ownedTenant) {
    return { success: false, error: ownedTenant.error };
  }

  const result = await db
    .update(products)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(products.id, productId),
        ownedTenant.user.isAdmin
          ? undefined
          : eq(products.tenantId, ownedTenant.tenant.id)
      )
    )
    .returning({ id: products.id, status: products.status });

  if (result.length === 0) {
    return { success: false, error: "Listing not found or authorization failed." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-listings");
  revalidatePath("/browse");

  return { success: true, message: `Listing marked as ${status}.` };
}

/**
 * Republishes a listing (sets status to available and updates timestamp)
 */
export async function republishProductAction(productId: string): Promise<ActionResult> {
  const ownedTenant = await requireOwnedTenant();
  if ("error" in ownedTenant) {
    return { success: false, error: ownedTenant.error };
  }

  const result = await db
    .update(products)
    .set({ status: "available", isArchived: false, updatedAt: new Date() })
    .where(
      and(
        eq(products.id, productId),
        ownedTenant.user.isAdmin
          ? undefined
          : eq(products.tenantId, ownedTenant.tenant.id)
      )
    )
    .returning({ id: products.id });

  if (result.length === 0) {
    return { success: false, error: "Listing not found." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-listings");
  revalidatePath("/browse");

  return { success: true, message: "Listing republished successfully." };
}

/**
 * Increments product view count
 */
export async function incrementProductViewAction(productId: string): Promise<void> {
  try {
    const [p] = await db
      .select({ views: products.views })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (p) {
      await db
        .update(products)
        .set({ views: (p.views || 0) + 1 })
        .where(eq(products.id, productId));
    }
  } catch (e) {
    console.error("Error incrementing product view count:", e);
  }
}

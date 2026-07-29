"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { tenants, products } from "@/db/schema";
import { auth } from "@/auth";
import { slugify, slugifyWithSuffix } from "@/lib/slugify";
import {
  createStoreSchema,
  productSchema,
  type CreateStoreInput,
  type ProductInput,
} from "@/lib/validations/store";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

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
  | { tenant: typeof tenants.$inferSelect; userId: string };

async function requireOwnedTenant(): Promise<OwnedTenantResult> {
  const session = await auth();

  if (!session?.user) {
    return { error: "You need to sign in first." };
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, session.user.id))
    .limit(1);

  if (!tenant) {
    return { error: "You need to create a store before listing items." };
  }

  return { tenant, userId: session.user.id };
}

export async function createProductAction(
  input: ProductInput
): Promise<ActionResult<{ slug: string }>> {
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
  });

  revalidatePath("/dashboard");
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

  // Ownership check: only update a product if it belongs to this seller's tenant.
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
      and(eq(products.id, productId), eq(products.tenantId, ownedTenant.tenant.id))
    )
    .returning({ id: products.id });

  if (result.length === 0) {
    return { success: false, error: "Listing not found." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/browse");

  return { success: true, data: undefined };
}

export async function toggleArchiveProductAction(
  productId: string,
  isArchived: boolean
): Promise<ActionResult> {
  const ownedTenant = await requireOwnedTenant();
  if ("error" in ownedTenant) {
    return { success: false, error: ownedTenant.error };
  }

  const result = await db
    .update(products)
    .set({ isArchived, updatedAt: new Date() })
    .where(
      and(eq(products.id, productId), eq(products.tenantId, ownedTenant.tenant.id))
    )
    .returning({ id: products.id });

  if (result.length === 0) {
    return { success: false, error: "Listing not found." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/browse");

  return { success: true, data: undefined };
}


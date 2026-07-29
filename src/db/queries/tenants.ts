import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tenants } from "@/db/schema";

export async function getTenantBySlug(slug: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  return tenant;
}

export async function getTenantByOwnerId(ownerId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, ownerId))
    .limit(1);

  return tenant;
}

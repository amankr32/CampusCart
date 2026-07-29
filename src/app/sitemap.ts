import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { products, tenants } from "@/db/schema";

const STATIC_ROUTES = [
  "",
  "/browse",
  "/how-it-works",
  "/about",
  "/contact",
  "/faq",
  "/safety",
  "/guidelines",
  "/sign-in",
  "/sign-up",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${appUrl}${route}`,
    changeFrequency: route === "" || route === "/browse" ? "daily" : "monthly",
    priority: route === "" ? 1 : 0.6,
  }));

  const [publishedProducts, allTenants] = await Promise.all([
    db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isArchived, false)),
    db.select({ slug: tenants.slug }).from(tenants),
  ]);

  const productEntries: MetadataRoute.Sitemap = publishedProducts.map(
    (product) => ({
      url: `${appUrl}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  const storeEntries: MetadataRoute.Sitemap = allTenants.map((tenant) => ({
    url: `${appUrl}/store/${tenant.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...productEntries, ...storeEntries];
}

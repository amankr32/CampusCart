import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Store } from "lucide-react";

import { getTenantBySlug } from "@/db/queries/tenants";
import { getProducts } from "@/db/queries/products";
import { ProductGrid } from "@/components/products/product-grid";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    return { title: "Store not found — Campus Cart" };
  }

  return { title: `${tenant.storeName} — Campus Cart` };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    notFound();
  }

  const { docs } = await getProducts({ tenantSlug: slug, page: 1 });

  return (
    <div className="max-w-(--breakpoint-xl) mx-auto w-full px-4 lg:px-12 py-10">
      <div className="flex items-center gap-4 mb-10">
        <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl border border-[var(--border-subtle)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] overflow-hidden shrink-0 shadow-xs">
          {tenant.imageUrl ? (
            <Image
              src={tenant.imageUrl}
              alt={tenant.storeName}
              fill
              className="object-cover"
            />
          ) : (
            <Store className="h-7 w-7" />
          )}
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            {tenant.storeName}
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            {docs.length} {docs.length === 1 ? "listing" : "listings"}
          </p>
        </div>
      </div>

      <ProductGrid products={docs} />
    </div>
  );
}

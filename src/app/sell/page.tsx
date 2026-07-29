import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { getTenantByOwnerId } from "@/db/queries/tenants";
import { getTopLevelCategories } from "@/db/queries/categories";
import { CreateStoreForm } from "@/components/store/create-store-form";
import { ProductForm } from "@/components/store/product-form";

export const metadata: Metadata = {
  title: "Sell on PTU Bazar",
};

export default async function SellPage() {
  const session = await auth();

  // The proxy already redirects anonymous visitors, but this is the
  // authoritative check — never trust the proxy alone (see src/proxy.ts).
  if (!session?.user) {
    return null;
  }

  const tenant = await getTenantByOwnerId(session.user.id);

  if (!tenant) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl mb-2">
              Set up your store
            </h1>
            <p className="text-black/60">
              One quick step before you list your first item.
            </p>
          </div>
          <div className="border border-[var(--border-subtle)] rounded-xl bg-white shadow-[var(--shadow-card)] p-6 sm:p-8">
            <CreateStoreForm />
          </div>
        </div>
      </div>
    );
  }

  const categories = await getTopLevelCategories();

  return (
    <div className="max-w-(--breakpoint-sm) mx-auto w-full px-4 py-12">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-black/50 hover:text-black"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="font-display font-bold text-3xl mt-3">
          List a new item
        </h1>
        <p className="text-black/60 mt-1">
          Selling as <span className="font-medium">{tenant.storeName}</span>
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}

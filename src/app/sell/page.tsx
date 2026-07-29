import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { getTenantByOwnerId } from "@/db/queries/tenants";
import { getTopLevelCategories } from "@/db/queries/categories";
import { CreateStoreForm } from "@/components/store/create-store-form";
import { ProductForm } from "@/components/store/product-form";

export const metadata: Metadata = {
  title: "Sell on Campus Cart",
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
    <div className="w-full px-4 lg:px-12 py-10">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-8 items-start">
        <ProductForm categories={categories} />

        <aside className="rounded-xl border border-[var(--border-subtle)] bg-white p-5 flex flex-col gap-5">
          <h2 className="font-semibold">Selling on Campus Cart</h2>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium">Verified students only</p>
              <p className="text-xs text-black/50 mt-0.5">
                Only campus email IDs can buy and sell.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">No platform fee</p>
              <p className="text-xs text-black/50 mt-0.5">
                Keep 100% of your earnings.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Safe campus deals</p>
              <p className="text-xs text-black/50 mt-0.5">
                Meet on campus and stay safe.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Direct chat</p>
              <p className="text-xs text-black/50 mt-0.5">
                Chat directly with interested students.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-orange-50 border border-orange-100 p-3">
            <p className="text-sm font-medium">Need help?</p>
            <p className="text-xs text-black/60 mt-0.5">
              Check our selling guide or contact support.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
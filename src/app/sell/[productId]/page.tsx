import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Tag, Lock, MessageSquare } from "lucide-react";

import { auth } from "@/auth";
import { getTenantByOwnerId } from "@/db/queries/tenants";
import { getProductById } from "@/db/queries/products";
import { getTopLevelCategories } from "@/db/queries/categories";
import { ProductForm } from "@/components/store/product-form";

export const metadata: Metadata = {
  title: "Edit Listing - Campus Cart",
};

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const tenant = await getTenantByOwnerId(session.user.id);
  const product = await getProductById(productId);

  // Ownership check: a seller can only edit their own listings or admin
  if (!tenant || !product || (product.tenantId !== tenant.id && !session.user.isAdmin)) {
    notFound();
  }

  const categories = await getTopLevelCategories();

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      <Link
        href="/dashboard/my-listings"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Listings
      </Link>

      <div className="bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xs">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
          Edit Listing Details
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Updating <span className="font-bold text-[var(--brand-primary)]">{product.name}</span> in <span className="font-semibold text-[var(--text-primary)]">{tenant.storeName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xs">
          <ProductForm
            categories={categories}
            productId={product.id}
            defaultValues={{
              name: product.name,
              description: product.description ?? "",
              priceRupees: product.priceCents / 100,
              condition: product.condition,
              categoryId: product.categoryId ?? "",
              hostel: product.hostel ?? "",
              branch: product.branch ?? "",
              quantity: product.quantity,
              images: product.images,
            }}
          />
        </div>

        <aside className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 flex flex-col gap-5 shadow-xs">
          <h2 className="font-bold font-display text-[var(--text-primary)] text-base">Listing Management Tips</h2>

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">Price &amp; Condition</p>
                <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Fair prices according to item condition help sell items faster on campus.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">Clear Photos</p>
                <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  High quality photos increase buyer trust and reduce questions in chat.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">Hostel Pickup</p>
                <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Keeping your hostel/branch location accurate makes campus handoff easier.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">Instant Status Sync</p>
                <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Mark items as Sold or Hidden from your seller dashboard when sold offline.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

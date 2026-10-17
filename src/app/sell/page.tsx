import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Tag, Lock, MessageSquare } from "lucide-react";

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

  if (!session?.user) {
    return null;
  }

  const tenant = await getTenantByOwnerId(session.user.id);

  if (!tenant) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display font-extrabold text-3xl text-[var(--text-primary)] mb-2">
              Set Up Your Storefront
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              One quick step before you list your first item on CampusCart.
            </p>
          </div>
          <div className="border border-[var(--border-subtle)] rounded-3xl bg-[var(--card-bg)] shadow-xl p-6 sm:p-8">
            <CreateStoreForm />
          </div>
        </div>
      </div>
    );
  }

  const categories = await getTopLevelCategories();

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xs">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
          List a New Item
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Posting as verified seller <span className="font-bold text-[var(--brand-primary)]">{tenant.storeName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xs">
          <ProductForm categories={categories} />
        </div>

        <aside className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 flex flex-col gap-5 shadow-xs">
          <h2 className="font-bold font-display text-[var(--text-primary)] text-base">Selling on CampusCart</h2>

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">Verified Students Only</p>
                <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Only verified university students can buy and sell on CampusCart.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">Zero Platform Fees</p>
                <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Keep 100% of your price — direct student transactions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">Safe Campus Handoff</p>
                <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Meet safely on campus to complete your physical exchange.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">Direct In-App Chat</p>
                <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Negotiate price and arrange campus pickup directly in chat.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--brand-primary-light)] border border-indigo-500/20 p-4">
            <p className="text-xs font-bold text-[var(--brand-primary)]">Listing Guidelines</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              Unverified students can post up to 2 active listings. Get Student Verified to unlock unlimited listings!
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
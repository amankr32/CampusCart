import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { eq, desc } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, products } from "@/db/schema";
import { MyListingsDashboard } from "@/components/products/my-listings-dashboard";
import { Button } from "@/components/ui/button";

export default async function MyListingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/dashboard/my-listings");
  }

  // Fetch tenant for current user
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, session.user.id))
    .limit(1);

  if (!tenant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">No Storefront Found</h1>
        <p className="text-[var(--text-muted)]">Please create a storefront to manage your listings.</p>
        <Link href="/sell">
          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-xs px-4 py-2.5">
            + Create Storefront & List Item
          </Button>
        </Link>
      </div>
    );
  }

  // Fetch seller's products
  const sellerProducts = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenant.id))
    .orderBy(desc(products.createdAt));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--card-bg)] p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[var(--text-primary)] tracking-tight">
            My Listings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Manage your listed textbooks, electronics, and campus items. Edit details, toggle availability, or post new items.
          </p>
        </div>

        <Link href="/sell" className="shrink-0">
          <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer">
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Post New Listing
          </Button>
        </Link>
      </div>

      <MyListingsDashboard initialProducts={sellerProducts} storeSlug={tenant.slug} />
    </div>
  );
}

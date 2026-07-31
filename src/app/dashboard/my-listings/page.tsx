import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MyListingsDashboard } from "@/components/products/my-listings-dashboard";

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
        <h1 className="text-2xl font-bold font-display text-slate-900">No Storefront Found</h1>
        <p className="text-slate-600">Please create a store or listing to access your seller dashboard.</p>
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900 tracking-tight">
            My Listings Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Manage your store items, edit details, update product availability, or permanently delete listings.
          </p>
        </div>
      </div>

      <MyListingsDashboard initialProducts={sellerProducts} storeSlug={tenant.slug} />
    </div>
  );
}

import Link from "next/link";
import { MessageCircle, Plus, Receipt } from "lucide-react";

import { auth } from "@/auth";
import { getTenantByOwnerId } from "@/db/queries/tenants";
import { getProductsByTenantId } from "@/db/queries/products";
import { Button } from "@/components/ui/button";
import { ListingRow } from "@/components/store/listing-row";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const tenant = await getTenantByOwnerId(session.user.id);

  return (
    <div className="max-w-(--breakpoint-md) mx-auto w-full px-4 py-12">
      <h1 className="font-display font-bold text-3xl mb-1">
        Welcome, {session.user.name?.split(" ")[0]}
      </h1>
      <p className="text-black/60 mb-8">
        Manage your store and listings from here.
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/dashboard/messages"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-black bg-white shadow-[var(--shadow-cartoon-sm)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all w-fit"
        >
          <span className="flex items-center justify-center h-9 w-9 rounded-full bg-[var(--brand-yellow)] border-2 border-black">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-xs text-black/50">Buyers & sellers</span>
            <span className="font-medium">Messages</span>
          </span>
        </Link>

        <Link
          href="/dashboard/sales"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-black bg-white shadow-[var(--shadow-cartoon-sm)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all w-fit"
        >
          <span className="flex items-center justify-center h-9 w-9 rounded-full bg-[var(--brand-yellow)] border-2 border-black">
            <Receipt className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-xs text-black/50">Order history</span>
            <span className="font-medium">Sales</span>
          </span>
        </Link>
      </div>

      {!tenant ? (
        <div className="p-6 rounded-lg border-2 border-black bg-white shadow-[var(--shadow-cartoon)]">
          <h2 className="font-display font-semibold text-lg mb-2">
            You don&apos;t have a store yet
          </h2>
          <p className="text-black/60 text-sm mb-4">
            Set one up to start listing items for sale.
          </p>
          <Link href="/sell">
            <Button variant="brand">Set up my store</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-xl">
              Your listings
            </h2>
            <Link href="/sell">
              <Button variant="elevated" size="sm">
                <Plus className="h-4 w-4" />
                New listing
              </Button>
            </Link>
          </div>

          <ListingsList tenantId={tenant.id} />
        </div>
      )}
    </div>
  );
}

async function ListingsList({ tenantId }: { tenantId: string }) {
  const listings = await getProductsByTenantId(tenantId);

  if (listings.length === 0) {
    return (
      <p className="text-black/50 text-sm py-8 text-center border-2 border-dashed border-black/20 rounded-lg">
        No listings yet — create your first one above.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {listings.map((product) => (
        <ListingRow key={product.id} product={product} />
      ))}
    </div>
  );
}

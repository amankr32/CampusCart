import Image from "next/image";
import Link from "next/link";
import { ImageOff, Star } from "lucide-react";

import { auth } from "@/auth";
import { getTenantByOwnerId } from "@/db/queries/tenants";
import { getSalesByTenantId } from "@/db/queries/orders";
import { getBuyerReputation } from "@/db/queries/products";
import { formatPrice } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  seller_confirmed: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<string, string> = {
  seller_confirmed: "bg-[var(--brand-yellow)]/40 text-black",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-black/5 text-black/50",
};

export default async function SalesPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const tenant = await getTenantByOwnerId(session.user.id);
  const sales = tenant ? await getSalesByTenantId(tenant.id) : [];

  const uniqueBuyerIds = [...new Set(sales.map((s) => s.buyer.id))];
  const reputations = await Promise.all(
    uniqueBuyerIds.map(async (id) => [id, await getBuyerReputation(id)] as const)
  );
  const reputationByBuyerId = new Map(reputations);

  const groups = [
    { label: "Pending", sales: sales.filter((o) => o.status === "seller_confirmed") },
    { label: "Completed", sales: sales.filter((o) => o.status === "completed") },
    { label: "Cancelled", sales: sales.filter((o) => o.status === "cancelled") },
  ];

  return (
    <div className="max-w-(--breakpoint-sm) mx-auto w-full px-4 py-12">
      <h1 className="font-display font-bold text-3xl mb-2">Your sales</h1>
      <p className="text-sm text-black/50 mb-8">
        Items you&apos;ve sold — mark orders as sold from the buyer&apos;s conversation.
      </p>

      {!tenant || sales.length === 0 ? (
        <p className="text-black/50 text-sm py-8 text-center border-2 border-dashed border-black/20 rounded-lg">
          No sales yet — mark an item as sold from a conversation with a
          buyer to see it here.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(
            (group) =>
              group.sales.length > 0 && (
                <section key={group.label}>
                  <h2 className="text-sm font-semibold text-black/50 uppercase tracking-wide mb-3">
                    {group.label} sales
                  </h2>
                  <div className="flex flex-col gap-3">
                    {group.sales.map((sale) => (
                      <Link
                        key={sale.id}
                        href={`/product/${sale.product.slug}`}
                        className="flex items-center gap-4 p-4 rounded-lg border-2 border-black bg-white hover:bg-black/5 transition-colors"
                      >
                        <div className="relative h-16 w-16 rounded-md bg-black/5 border-2 border-black overflow-hidden shrink-0">
                          {sale.product.images[0] ? (
                            <Image
                              src={sale.product.images[0]}
                              alt={sale.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-black/20">
                              <ImageOff className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{sale.product.name}</p>
                          <p className="text-sm text-black/50 flex items-center gap-1.5">
                            Buyer: {sale.buyer.name}
                            {(reputationByBuyerId.get(sale.buyer.id)?.reviewCount ?? 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-black/60">
                                <Star className="h-3 w-3 fill-[var(--brand-yellow)] text-black" />
                                {reputationByBuyerId.get(sale.buyer.id)!.averageRating.toFixed(1)}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-display font-semibold">
                            {formatPrice(sale.totalCents)}
                          </p>
                          <span
                            className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 mt-1 ${STATUS_STYLES[sale.status] ?? ""}`}
                          >
                            {STATUS_LABELS[sale.status] ?? sale.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )
          )}
        </div>
      )}
    </div>
  );
}

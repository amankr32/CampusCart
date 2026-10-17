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
  seller_confirmed: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-[var(--border-subtle)] text-[var(--text-muted)]",
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
    <div className="max-w-4xl mx-auto w-full px-4 py-10 space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-[var(--text-primary)] tracking-tight">Your Sales</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Items you&apos;ve sold — mark orders as sold from the buyer&apos;s conversation thread.
        </p>
      </div>

      {!tenant || sales.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-3xl p-8 space-y-2">
          <p className="text-[var(--text-muted)] text-sm">
            No sales yet — mark an item as sold from a chat conversation with a buyer to see it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(
            (group) =>
              group.sales.length > 0 && (
                <section key={group.label} className="space-y-3">
                  <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {group.label} Sales ({group.sales.length})
                  </h2>
                  <div className="flex flex-col gap-3">
                    {group.sales.map((sale) => (
                      <Link
                        key={sale.id}
                        href={`/product/${sale.product.slug}`}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-16 w-16 rounded-xl bg-[var(--border-subtle)]/40 border border-[var(--border-subtle)] overflow-hidden shrink-0">
                          {sale.product.images[0] ? (
                            <Image
                              src={sale.product.images[0]}
                              alt={sale.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                              <ImageOff className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--text-primary)] truncate">{sale.product.name}</p>
                          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                            Buyer: <span className="font-semibold text-[var(--text-primary)]">{sale.buyer.name}</span>
                            {(reputationByBuyerId.get(sale.buyer.id)?.reviewCount ?? 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-[var(--text-muted)]">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {reputationByBuyerId.get(sale.buyer.id)!.averageRating.toFixed(1)}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-[var(--brand-primary)] text-base">
                            {formatPrice(sale.totalCents)}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 mt-1 ${STATUS_STYLES[sale.status] ?? ""}`}
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

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
  cancelled: "bg-slate-100 text-slate-500",
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
        <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Your Sales</h1>
        <p className="text-sm text-slate-600">
          Items you&apos;ve sold — mark orders as sold from the buyer&apos;s conversation thread.
        </p>
      </div>

      {!tenant || sales.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-8 space-y-2">
          <p className="text-slate-500 text-sm">
            No sales yet — mark an item as sold from a chat conversation with a buyer to see it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(
            (group) =>
              group.sales.length > 0 && (
                <section key={group.label} className="space-y-3">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {group.label} Sales ({group.sales.length})
                  </h2>
                  <div className="flex flex-col gap-3">
                    {group.sales.map((sale) => (
                      <Link
                        key={sale.id}
                        href={`/product/${sale.product.slug}`}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-16 w-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {sale.product.images[0] ? (
                            <Image
                              src={sale.product.images[0]}
                              alt={sale.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-300">
                              <ImageOff className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{sale.product.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            Buyer: <span className="font-semibold text-slate-700">{sale.buyer.name}</span>
                            {(reputationByBuyerId.get(sale.buyer.id)?.reviewCount ?? 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-slate-600">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {reputationByBuyerId.get(sale.buyer.id)!.averageRating.toFixed(1)}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-indigo-600 text-base">
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

import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { auth } from "@/auth";
import { getOrdersByBuyerId } from "@/db/queries/orders";
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

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const orders = await getOrdersByBuyerId(session.user.id);

  const groups = [
    { label: "Pending", orders: orders.filter((o) => o.status === "seller_confirmed") },
    { label: "Completed", orders: orders.filter((o) => o.status === "completed") },
    { label: "Cancelled", orders: orders.filter((o) => o.status === "cancelled") },
  ];

  return (
    <div className="max-w-(--breakpoint-sm) mx-auto w-full px-4 py-12">
      <h1 className="font-display font-bold text-3xl mb-2">Your orders</h1>
      <p className="text-sm text-black/50 mb-8">
        Items you&apos;ve bought — payment and pickup happen offline with the seller.
      </p>

      {orders.length === 0 ? (
        <p className="text-black/50 text-sm py-8 text-center border-2 border-dashed border-black/20 rounded-lg">
          No orders yet — your purchases will show up here once a seller
          marks something as sold to you.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(
            (group) =>
              group.orders.length > 0 && (
                <section key={group.label}>
                  <h2 className="text-sm font-semibold text-black/50 uppercase tracking-wide mb-3">
                    {group.label} orders
                  </h2>
                  <div className="flex flex-col gap-3">
                    {group.orders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/product/${order.product.slug}`}
                        className="flex items-center gap-4 p-4 rounded-lg border-2 border-black bg-white hover:bg-black/5 transition-colors"
                      >
                        <div className="relative h-16 w-16 rounded-md bg-black/5 border-2 border-black overflow-hidden shrink-0">
                          {order.product.images[0] ? (
                            <Image
                              src={order.product.images[0]}
                              alt={order.product.name}
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
                          <p className="font-medium truncate">{order.product.name}</p>
                          <p className="text-sm text-black/50">
                            {order.tenant.storeName}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-display font-semibold">
                            {formatPrice(order.totalCents)}
                          </p>
                          <span
                            className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 mt-1 ${STATUS_STYLES[order.status] ?? ""}`}
                          >
                            {STATUS_LABELS[order.status] ?? order.status}
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

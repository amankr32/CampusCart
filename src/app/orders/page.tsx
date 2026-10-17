import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getOrdersByBuyerId, getSalesByTenantId } from "@/db/queries/orders";
import { getTenantByOwnerId } from "@/db/queries/tenants";
import { OrdersDashboardClient, OrderItem } from "@/components/orders/orders-dashboard-client";

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/orders");
  }

  const buyerOrders = (await getOrdersByBuyerId(session.user.id)) as OrderItem[];

  const tenant = await getTenantByOwnerId(session.user.id);
  const salesOrders = tenant
    ? ((await getSalesByTenantId(tenant.id)) as OrderItem[])
    : [];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
      <OrdersDashboardClient buyerOrders={buyerOrders} salesOrders={salesOrders} />
    </div>
  );
}


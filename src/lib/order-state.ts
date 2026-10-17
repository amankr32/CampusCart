export type OrderStatus = "seller_confirmed" | "completed" | "cancelled";
export type ProductStatus = "available" | "reserved" | "sold" | "hidden";

/**
 * Validates whether an order state transition is permissible.
 * Terminal states ("completed", "cancelled") cannot transition further.
 */
export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  if (from === "seller_confirmed") {
    return to === "completed" || to === "cancelled";
  }
  return false;
}

/**
 * Computes product inventory status resulting from an order lifecycle transition.
 */
export function getProductStatusForOrderTransition(
  orderTo: OrderStatus,
  currentProductStatus: ProductStatus
): ProductStatus {
  switch (orderTo) {
    case "seller_confirmed":
      return currentProductStatus === "available" ? "reserved" : currentProductStatus;
    case "completed":
      return "sold";
    case "cancelled":
      return currentProductStatus === "reserved" ? "available" : currentProductStatus;
    default:
      return currentProductStatus;
  }
}

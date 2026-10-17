import { describe, it, expect } from "vitest";
import {
  canTransitionOrder,
  getProductStatusForOrderTransition,
  type OrderStatus,
} from "@/lib/order-state";

describe("Order State Transitions & Product Inventory Lifecycle", () => {
  describe("canTransitionOrder", () => {
    it("allows transitioning from seller_confirmed to completed", () => {
      expect(canTransitionOrder("seller_confirmed", "completed")).toBe(true);
    });

    it("allows transitioning from seller_confirmed to cancelled", () => {
      expect(canTransitionOrder("seller_confirmed", "cancelled")).toBe(true);
    });

    it("prevents transitioning completed orders to cancelled", () => {
      expect(canTransitionOrder("completed", "cancelled")).toBe(false);
    });

    it("prevents transitioning completed orders back to seller_confirmed", () => {
      expect(canTransitionOrder("completed", "seller_confirmed")).toBe(false);
    });

    it("prevents transitioning cancelled orders to completed", () => {
      expect(canTransitionOrder("cancelled", "completed")).toBe(false);
    });

    it("prevents transitioning cancelled orders back to seller_confirmed", () => {
      expect(canTransitionOrder("cancelled", "seller_confirmed")).toBe(false);
    });
  });

  describe("getProductStatusForOrderTransition", () => {
    it("reserves available product when seller confirms order", () => {
      const nextStatus = getProductStatusForOrderTransition("seller_confirmed", "available");
      expect(nextStatus).toBe("reserved");
    });

    it("marks product as sold when order is completed", () => {
      const nextStatus = getProductStatusForOrderTransition("completed", "reserved");
      expect(nextStatus).toBe("sold");
    });

    it("reverts reserved product to available when order is cancelled", () => {
      const nextStatus = getProductStatusForOrderTransition("cancelled", "reserved");
      expect(nextStatus).toBe("available");
    });

    it("does not revert an already sold product if a duplicate cancel is processed", () => {
      const nextStatus = getProductStatusForOrderTransition("cancelled", "sold");
      expect(nextStatus).toBe("sold");
    });
  });
});

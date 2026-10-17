import { describe, it, expect, beforeEach } from "vitest";
import { toast, useToastStore } from "@/lib/toast";

describe("Toast Store", () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it("adds a success toast to the store", () => {
    const id = toast.success("Item saved to wishlist", {
      description: "Added Casio fx-991 to your saved items",
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].type).toBe("success");
    expect(toasts[0].title).toBe("Item saved to wishlist");
    expect(toasts[0].description).toBe("Added Casio fx-991 to your saved items");
  });

  it("adds an error toast to the store", () => {
    const id = toast.error("Could not upload file", {
      description: "Maximum file size is 8MB",
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].type).toBe("error");
  });

  it("adds an info toast to the store", () => {
    const id = toast.info("Verification code copied");

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].type).toBe("info");
  });

  it("dismisses a toast by id", () => {
    const id1 = toast.success("Toast 1");
    const id2 = toast.success("Toast 2");

    expect(useToastStore.getState().toasts.length).toBe(2);

    toast.dismiss(id1);

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id2);
  });

  it("clears all toasts", () => {
    toast.success("1");
    toast.error("2");
    toast.info("3");

    expect(useToastStore.getState().toasts.length).toBe(3);

    useToastStore.getState().clearToasts();
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});

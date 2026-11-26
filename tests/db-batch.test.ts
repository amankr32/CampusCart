import { describe, expect, it, vi } from "vitest";
import { runAtomicBatch } from "@/lib/db-batch";

describe("runAtomicBatch", () => {
  it("uses db.batch when available (neon-http) and never calls db.transaction", async () => {
    const mockBatch = vi.fn().mockResolvedValue(["res-1", "res-2"]);
    const mockTransaction = vi.fn().mockRejectedValue(
      new Error("No transactions support in neon-http driver")
    );

    const fakeDb = {
      batch: mockBatch,
      transaction: mockTransaction,
    };

    const q1 = Promise.resolve("q1");
    const q2 = Promise.resolve("q2");

    const results = await runAtomicBatch(fakeDb as never, () => [
      q1 as never,
      q2 as never,
    ]);

    expect(results).toEqual(["res-1", "res-2"]);
    expect(mockBatch).toHaveBeenCalledWith([q1, q2]);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns empty array without calling db.batch when query list is empty", async () => {
    const mockBatch = vi.fn();
    const fakeDb = {
      batch: mockBatch,
      transaction: vi.fn(),
    };

    const results = await runAtomicBatch(fakeDb as never, () => []);

    expect(results).toEqual([]);
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("executes queries sequentially inside db.transaction when db.batch is absent (postgres-js)", async () => {
    const order: string[] = [];
    const txObj = { tag: "tx-client" };
    const mockTransaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(txObj)
    );

    const fakeDb = {
      transaction: mockTransaction,
    };

    const results = await runAtomicBatch(fakeDb as never, (tx) => {
      expect(tx).toBe(txObj);
      return [
        Promise.resolve().then(() => {
          order.push("first");
          return "r1";
        }) as never,
        Promise.resolve().then(() => {
          order.push("second");
          return "r2";
        }) as never,
      ];
    });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["first", "second"]);
    expect(results).toEqual(["r1", "r2"]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockRevalidatePath = vi.fn();
const mockDel = vi.fn();
const mockTransaction = vi.fn();
const mockSelectFrom = vi.fn();
const mockBatch = vi.fn();

let useBatchMode = false;

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@vercel/blob", () => ({
  del: (...args: unknown[]) => mockDel(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => mockSelectFrom(table),
    }),
    delete: (table: unknown) => ({
      where: () => ({ table, op: "delete" }),
    }),
    insert: (table: unknown) => ({
      values: (val: unknown) => ({ table, val, op: "insert" }),
    }),
    get batch() {
      return useBatchMode
        ? (queries: unknown[]) => mockBatch(queries)
        : undefined;
    },
    transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

import { adminDeleteUserAction } from "@/lib/actions/admin";
import {
  users,
  tenants,
  products,
  studentVerifications,
  orders,
  conversations,
  messages,
  reports,
  verificationCodes,
  passwordResetTokens,
  auditLogs,
} from "@/db/schema";

describe("adminDeleteUserAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBatchMode = false;
  });

  it("rejects non-admin callers", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isAdmin: false } });

    const res = await adminDeleteUserAction("user-2");

    expect(res).toEqual({
      success: false,
      error: "Unauthorized: Admin privileges required.",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("prevents an admin from deleting their own account", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", isAdmin: true } });

    const res = await adminDeleteUserAction("admin-1");

    expect(res).toEqual({
      success: false,
      error: "You cannot delete your own administrator account.",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("returns not found when target user does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", isAdmin: true } });

    mockSelectFrom.mockImplementation(() => ({
      where: () => ({
        limit: async () => [],
      }),
    }));

    const res = await adminDeleteUserAction("missing-user");

    expect(res).toEqual({
      success: false,
      error: "User account not found.",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockBatch).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("deletes storefront orders, user row, cleans up Vercel blobs, and logs audit event via transaction", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", isAdmin: true } });

    const deletedTables: unknown[] = [];
    const insertedValues: unknown[] = [];

    mockSelectFrom.mockImplementation((table: unknown) => ({
      where: () => {
        if (table === users) {
          return {
            limit: async () => [
              {
                id: "user-2",
                name: "Rohan Sharma",
                email: "rohan@ptu.ac.in",
                avatarUrl: "https://abc.public.blob.vercel-storage.com/avatar.png",
              },
            ],
          };
        }
        if (table === studentVerifications) {
          return Promise.resolve([
            {
              portalScreenshotUrl:
                "https://abc.public.blob.vercel-storage.com/proof.png",
            },
          ]);
        }
        if (table === conversations) {
          return Promise.resolve([{ id: "conv-1" }]);
        }
        if (table === messages) {
          return Promise.resolve([
            { image: "https://abc.public.blob.vercel-storage.com/chat.png" },
          ]);
        }
        if (table === tenants) {
          return {
            limit: async () => [
              {
                id: "tenant-1",
                imageUrl: null,
              },
            ],
          };
        }
        if (table === products) {
          return Promise.resolve([
            {
              id: "prod-1",
              images: ["https://abc.public.blob.vercel-storage.com/item.jpg"],
            },
          ]);
        }
        return Promise.resolve([]);
      },
    }));

    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        delete: (table: unknown) => ({
          where: async () => {
            deletedTables.push(table);
          },
        }),
        insert: (table: unknown) => ({
          values: async (val: unknown) => {
            insertedValues.push({ table, val });
          },
        }),
      };
      return fn(tx);
    });

    const res = await adminDeleteUserAction("user-2");

    expect(res).toEqual({ success: true });
    expect(deletedTables).toContain(orders);
    expect(deletedTables).toContain(reports);
    expect(deletedTables).toContain(verificationCodes);
    expect(deletedTables).toContain(passwordResetTokens);
    expect(deletedTables[deletedTables.length - 1]).toBe(users);

    expect(insertedValues).toEqual([
      {
        table: auditLogs,
        val: {
          userId: "admin-1",
          action: "ADMIN_USER_DELETED",
          details: {
            deletedUserId: "user-2",
            deletedEmail: "rohan@ptu.ac.in",
            deletedName: "Rohan Sharma",
          },
        },
      },
    ]);

    expect(mockDel).toHaveBeenCalledTimes(4);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/browse");
  });

  it("succeeds on neon-http driver via db.batch without calling db.transaction", async () => {
    useBatchMode = true;
    mockAuth.mockResolvedValue({ user: { id: "admin-1", isAdmin: true } });

    mockTransaction.mockRejectedValue(
      new Error("No transactions support in neon-http driver")
    );
    mockBatch.mockImplementation(async (queries: unknown[]) =>
      queries.map(() => ({ rows: [] }))
    );

    mockSelectFrom.mockImplementation((table: unknown) => ({
      where: () => {
        if (table === users) {
          return {
            limit: async () => [
              {
                id: "user-2",
                name: "Aman Kumar",
                email: "amanku6936@gmail.com",
                avatarUrl: null,
              },
            ],
          };
        }
        if (table === tenants) {
          return { limit: async () => [] };
        }
        return Promise.resolve([]);
      },
    }));

    const res = await adminDeleteUserAction("user-2");

    expect(res).toEqual({ success: true });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockBatch).toHaveBeenCalledTimes(1);

    const batchedQueries = mockBatch.mock.calls[0][0] as Array<{
      table: unknown;
      op: string;
      val?: unknown;
    }>;
    expect(batchedQueries.map((q) => q.table)).toEqual([
      reports,
      verificationCodes,
      passwordResetTokens,
      users,
      auditLogs,
    ]);
    expect(batchedQueries[batchedQueries.length - 1]).toMatchObject({
      table: auditLogs,
      op: "insert",
      val: {
        userId: "admin-1",
        action: "ADMIN_USER_DELETED",
        details: {
          deletedUserId: "user-2",
          deletedEmail: "amanku6936@gmail.com",
          deletedName: "Aman Kumar",
        },
      },
    });
  });
});

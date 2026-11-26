import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHeaders = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockHashPassword = vi.fn();

const mockSelectLimit = vi.fn();
const mockInsertValues = vi.fn();
const mockTxUpdateSet = vi.fn();
const mockTxUpdateReturning = vi.fn();
const mockTxDeleteWhere = vi.fn();
const mockBatch = vi.fn();

let useBatchMode = false;

vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {},
}));

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendVerificationOtpEmail: vi.fn(),
  sendPasswordResetEmail: (...args: unknown[]) =>
    mockSendPasswordResetEmail(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

vi.mock("@/lib/auth-token", () => ({
  createInternalAuthToken: vi.fn(),
}));

vi.mock("@/lib/password", () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/slugify", () => ({
  slugify: (s: string) => s.toLowerCase(),
}));

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => mockSelectLimit(),
          }),
          limit: () => mockSelectLimit(),
        }),
      }),
    }),
    insert: () => ({
      values: (...args: unknown[]) => mockInsertValues(...args),
    }),
    update: () => ({
      set: (values: unknown) => {
        mockTxUpdateSet(values);
        return {
          where: () => ({
            returning: () => ({ op: "update-returning" }),
            op: "update",
          }),
        };
      },
    }),
    delete: () => ({
      where: (...args: unknown[]) => {
        mockTxDeleteWhere(...args);
        return { op: "delete" };
      },
    }),
    get batch() {
      return useBatchMode
        ? (queries: unknown[]) => mockBatch(queries)
        : undefined;
    },
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        update: () => ({
          set: (values: unknown) => {
            mockTxUpdateSet(values);
            return {
              where: () => ({
                returning: () => mockTxUpdateReturning(),
              }),
            };
          },
        }),
        delete: () => ({
          where: (...args: unknown[]) => mockTxDeleteWhere(...args),
        }),
      };
      return fn(tx);
    },
  },
}));

import {
  forgotPasswordAction,
  resetPasswordAction,
  resetPasswordWithOtpAction,
} from "@/lib/actions/auth";

describe("Forgot & Reset Password Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBatchMode = false;
    mockCheckRateLimit.mockReturnValue({ success: true, remaining: 4, resetMs: 60000 });
    mockHeaders.mockResolvedValue({
      get: (name: string) => (name === "host" ? "192.168.1.10:3000" : null),
    });
    mockInsertValues.mockResolvedValue(undefined);
    mockHashPassword.mockResolvedValue("argon2-new-hash");
    mockTxDeleteWhere.mockResolvedValue(undefined);
  });

  describe("forgotPasswordAction", () => {
    it("uses http:// for LAN/local hosts and sends both reset URL and 6-digit code", async () => {
      mockSelectLimit.mockResolvedValue([
        { id: "user-1", email: "user@example.com" },
      ]);
      mockSendPasswordResetEmail.mockResolvedValue({ success: true });

      const res = await forgotPasswordAction({ email: "user@example.com" });

      expect(res.success).toBe(true);
      expect(mockInsertValues).toHaveBeenCalledTimes(2);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);

      const [emailArg, resetUrlArg, codeArg] =
        mockSendPasswordResetEmail.mock.calls[0] as [string, string, string];
      expect(emailArg).toBe("user@example.com");
      expect(resetUrlArg).toMatch(
        /^http:\/\/192\.168\.1\.10:3000\/reset-password\?token=[a-f0-9]{64}$/
      );
      expect(codeArg).toMatch(/^\d{6}$/);
    });

    it("surfaces email delivery errors instead of pretending success", async () => {
      mockSelectLimit.mockResolvedValue([
        { id: "user-1", email: "user@example.com" },
      ]);
      mockSendPasswordResetEmail.mockResolvedValue({
        success: false,
        error: "Brevo IP blocked",
      });

      const res = await forgotPasswordAction({ email: "user@example.com" });

      expect(res).toEqual({
        success: false,
        error: "Could not send password reset email: Brevo IP blocked",
      });
    });
  });

  describe("resetPasswordAction", () => {
    it("rejects invalid or expired tokens", async () => {
      mockSelectLimit.mockResolvedValue([]);

      const res = await resetPasswordAction({
        token: "bad-token",
        password: "NewPassword123!",
      });

      expect(res.success).toBe(false);
      expect(mockTxUpdateSet).not.toHaveBeenCalled();
    });

    it("hashes and updates password in DB permanently and invalidates reset tokens", async () => {
      mockSelectLimit
        .mockResolvedValueOnce([
          { id: "tok-1", email: "user@example.com", token: "valid-token" },
        ])
        .mockResolvedValueOnce([{ id: "user-1" }]);
      mockTxUpdateReturning.mockResolvedValue([{ id: "user-1" }]);

      const res = await resetPasswordAction({
        token: "  valid-token  ",
        password: "NewPassword123!",
      });

      expect(res.success).toBe(true);
      expect(mockHashPassword).toHaveBeenCalledWith("NewPassword123!");
      expect(mockTxUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: "argon2-new-hash",
        })
      );
      expect(mockTxUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          usedAt: expect.any(Date),
        })
      );
      expect(mockTxDeleteWhere).toHaveBeenCalledTimes(1);
    });

    it("works via db.batch on neon-http driver", async () => {
      useBatchMode = true;
      mockSelectLimit
        .mockResolvedValueOnce([
          { id: "tok-1", email: "user@example.com", token: "valid-token" },
        ])
        .mockResolvedValueOnce([{ id: "user-1" }]);
      mockBatch.mockResolvedValue([[{ id: "user-1" }], undefined, undefined]);

      const res = await resetPasswordAction({
        token: "valid-token",
        password: "NewPassword123!",
      });

      expect(res.success).toBe(true);
      expect(mockBatch).toHaveBeenCalledTimes(1);
    });
  });

  describe("resetPasswordWithOtpAction", () => {
    it("updates password permanently when valid 6-digit code is submitted", async () => {
      mockSelectLimit
        .mockResolvedValueOnce([
          { id: "code-1", email: "user@example.com", code: "123456" },
        ])
        .mockResolvedValueOnce([{ id: "user-1" }]);
      mockTxUpdateReturning.mockResolvedValue([{ id: "user-1" }]);

      const res = await resetPasswordWithOtpAction({
        email: "user@example.com",
        code: "123456",
        password: "NewPassword123!",
      });

      expect(res.success).toBe(true);
      expect(mockHashPassword).toHaveBeenCalledWith("NewPassword123!");
      expect(mockTxUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: "argon2-new-hash",
        })
      );
      expect(mockTxDeleteWhere).toHaveBeenCalledTimes(1);
    });
  });
});

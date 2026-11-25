import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignIn = vi.fn();
const mockSendVerificationOtpEmail = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockCreateInternalAuthToken = vi.fn();
const mockSelectLimit = vi.fn();
const mockInsertValues = vi.fn();
const mockUpdateSet = vi.fn();
const mockDeleteWhere = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {},
}));

vi.mock("@/auth", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

vi.mock("@/lib/email", () => ({
  sendVerificationOtpEmail: (...args: unknown[]) =>
    mockSendVerificationOtpEmail(...args),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

vi.mock("@/lib/auth-token", () => ({
  createInternalAuthToken: (...args: unknown[]) =>
    mockCreateInternalAuthToken(...args),
}));

vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn(),
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
        mockUpdateSet(values);
        return {
          where: () => Promise.resolve(),
        };
      },
    }),
    delete: () => ({
      where: (...args: unknown[]) => mockDeleteWhere(...args),
    }),
  },
}));

import { verifyOtpAction } from "@/lib/actions/auth";

describe("Email OTP Verification (Auto-Verified Account)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ success: true, remaining: 4, resetMs: 60000 });
    mockSendVerificationOtpEmail.mockResolvedValue({ success: true });
    mockCreateInternalAuthToken.mockReturnValue("signed-token");
    mockInsertValues.mockResolvedValue(undefined);
    mockDeleteWhere.mockResolvedValue(undefined);
    mockSignIn.mockResolvedValue(undefined);
  });

  it("rejects invalid or expired OTP codes", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const res = await verifyOtpAction({
      email: "newuser@gmail.com",
      code: "123456",
    });

    expect(res.success).toBe(false);
    expect(mockUpdateSet).not.toHaveBeenCalled();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("automatically verifies account (no roll number needed) and signs user in after signup OTP", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{ id: "code-2", email: "newuser@gmail.com", code: "778899" }])
      .mockResolvedValueOnce([
        { id: "user-2", emailVerifiedAt: null, trustScore: 20 },
      ]);

    const res = await verifyOtpAction({
      email: "newuser@gmail.com",
      code: "778899",
    });

    expect(res).toEqual({
      success: true,
      message: "Account verified and signed in!",
    });
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        studentStatus: "verified",
        trustScore: 85,
        rejectionReason: null,
      })
    );
    const updatePayload = mockUpdateSet.mock.calls[0][0] as {
      emailVerifiedAt: Date;
    };
    expect(updatePayload.emailVerifiedAt).toBeInstanceOf(Date);

    expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "newuser@gmail.com",
      password: "__otp_verified__",
      preVerifiedToken: "signed-token",
      redirect: false,
    });
  });
});

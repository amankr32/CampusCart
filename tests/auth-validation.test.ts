import { describe, it, expect } from "vitest";
import {
  signUpSchema,
  signInSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

describe("Auth Validation Schemas", () => {
  describe("signUpSchema", () => {
    it("accepts valid registration input", () => {
      const result = signUpSchema.safeParse({
        name: "Aman Kumar",
        email: "aman@ptu.ac.in",
        password: "securePassword123!",
        confirmPassword: "securePassword123!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("aman@ptu.ac.in");
      }
    });

    it("rejects mismatched passwords", () => {
      const result = signUpSchema.safeParse({
        name: "Aman Kumar",
        email: "aman@ptu.ac.in",
        password: "securePassword123!",
        confirmPassword: "differentPassword456!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match.");
      }
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = signUpSchema.safeParse({
        name: "Aman Kumar",
        email: "aman@ptu.ac.in",
        password: "short",
        confirmPassword: "short",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("at least 8 characters"))).toBe(
          true
        );
      }
    });

    it("rejects passwords longer than 72 characters", () => {
      const longPass = "A".repeat(73);
      const result = signUpSchema.safeParse({
        name: "Aman Kumar",
        email: "aman@ptu.ac.in",
        password: longPass,
        confirmPassword: longPass,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("too long"))).toBe(true);
      }
    });

    it("normalizes and lowercases email address", () => {
      const result = signUpSchema.safeParse({
        name: "Aman Kumar",
        email: "  AMAN.K@PTU.AC.IN  ",
        password: "securePassword123!",
        confirmPassword: "securePassword123!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("aman.k@ptu.ac.in");
      }
    });

    it("rejects invalid email formats", () => {
      const result = signUpSchema.safeParse({
        name: "Aman Kumar",
        email: "not-an-email",
        password: "securePassword123!",
        confirmPassword: "securePassword123!",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("signInSchema", () => {
    it("accepts valid sign in credentials", () => {
      const result = signInSchema.safeParse({
        email: "student@ptu.ac.in",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const result = signInSchema.safeParse({
        email: "student@ptu.ac.in",
        password: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("verifyOtpSchema", () => {
    it("accepts exact 6-digit numeric verification codes", () => {
      const result = verifyOtpSchema.safeParse({
        email: "student@ptu.ac.in",
        code: "847291",
      });

      expect(result.success).toBe(true);
    });

    it("rejects non-numeric OTP codes", () => {
      const result = verifyOtpSchema.safeParse({
        email: "student@ptu.ac.in",
        code: "84729A",
      });

      expect(result.success).toBe(false);
    });

    it("rejects codes of incorrect length", () => {
      expect(
        verifyOtpSchema.safeParse({ email: "student@ptu.ac.in", code: "12345" }).success
      ).toBe(false);
      expect(
        verifyOtpSchema.safeParse({ email: "student@ptu.ac.in", code: "1234567" }).success
      ).toBe(false);
    });
  });

  describe("forgotPasswordSchema & resetPasswordSchema", () => {
    it("validates forgot password request email", () => {
      expect(forgotPasswordSchema.safeParse({ email: "test@domain.com" }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(false);
    });

    it("validates reset password token and new password rules", () => {
      const valid = resetPasswordSchema.safeParse({
        token: "jwt-reset-token-sample",
        password: "brandNewSecurePassword88",
      });
      expect(valid.success).toBe(true);

      const tooShort = resetPasswordSchema.safeParse({
        token: "jwt-reset-token-sample",
        password: "123",
      });
      expect(tooShort.success).toBe(false);
    });
  });
});

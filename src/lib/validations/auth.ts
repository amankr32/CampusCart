import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "That name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  code: z
    .string()
    .trim()
    .length(6, "Verification code must be 6 digits.")
    .regex(/^\d{6}$/, "Verification code must contain only numbers."),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Invalid password reset token."),
  password: z
    .string()
    .min(8, "New password must be at least 8 characters.")
    .max(72, "Password is too long."),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

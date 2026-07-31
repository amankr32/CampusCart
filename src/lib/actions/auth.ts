"use server";

import crypto from "crypto";
import { eq, and, gt, isNull, desc } from "drizzle-orm";
import { AuthError } from "next-auth";

import { db } from "@/db";
import { users, verificationCodes, passwordResetTokens, tenants } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signIn } from "@/auth";
import { sendVerificationOtpEmail, sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/slugify";
import {
  signUpSchema,
  signInSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type SignUpInput,
  type SignInInput,
  type VerifyOtpInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; isUnverified?: boolean; email?: string };

/**
 * Robust Sign-In Action with Explicit Email Verification Enforcement
 */
export async function credentialsSignInAction(
  input: SignInInput
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Enter valid credentials.",
    };
  }

  const { email, password } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (!user) {
    return { success: false, error: "Invalid email address or password." };
  }

  // Verify password with Argon2
  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return { success: false, error: "Invalid email address or password." };
  }

  // Check Email Verification status
  if (!user.emailVerifiedAt) {
    // Generate a fresh OTP code and send
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(verificationCodes).values({
      email: cleanEmail,
      code: otpCode,
      expiresAt,
    });

    await sendVerificationOtpEmail(cleanEmail, otpCode);

    return {
      success: false,
      isUnverified: true,
      email: cleanEmail,
      error: "Your email address is not verified yet. A new 6-digit OTP code has been sent to your email.",
    };
  }

  // Sign in via Auth.js / NextAuth
  try {
    await signIn("credentials", {
      email: cleanEmail,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Authentication failed. Please check your password." };
    }
    throw error;
  }

  return { success: true };
}

/**
 * User Registration Action
 * Hashes password with Argon2, creates user (email unverified), generates & sends 6-digit OTP code.
 */
export async function signUpAction(
  input: SignUpInput
): Promise<ActionResult<{ email: string }>> {
  const parsed = signUpSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const { name, email, password } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  // Check rate limit for sign-up attempts
  const rateCheck = checkRateLimit(`signup:${cleanEmail}`, 5, 15 * 60 * 1000);
  if (!rateCheck.success) {
    return {
      success: false,
      error: "Too many sign-up attempts. Please try again in a few minutes.",
    };
  }

  // Check if email already registered
  const [existingUser] = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (existingUser) {
    if (!existingUser.emailVerifiedAt) {
      // User exists but hasn't verified email yet. Regenerate OTP and send.
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db.insert(verificationCodes).values({
        email: cleanEmail,
        code: otpCode,
        expiresAt,
      });

      await sendVerificationOtpEmail(cleanEmail, otpCode);

      return {
        success: true,
        data: { email: cleanEmail },
        message: "Account exists but is not verified. We sent a new verification code.",
      };
    }

    return {
      success: false,
      error: "An account with this email address already exists. Please sign in.",
    };
  }

  // Generate unique username & store slug
  const baseUsername = cleanEmail.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() || "student";
  let username = baseUsername;
  let counter = 1;
  while (true) {
    const [found] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!found) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }

  // Hash password using Argon2
  const passwordHash = await hashPassword(password);

  // Insert user into DB
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email: cleanEmail,
      passwordHash,
      username,
      emailVerifiedAt: null,
      studentStatus: "unverified",
      trustScore: 20,
    })
    .returning({ id: users.id, name: users.name });

  // Create default tenant/storefront for seller profile
  const storeSlug = `${slugify(name)}-${newUser.id.slice(0, 6)}`;
  await db.insert(tenants).values({
    ownerId: newUser.id,
    storeName: `${name}'s Store`,
    slug: storeSlug,
  });

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(verificationCodes).values({
    email: cleanEmail,
    code: otpCode,
    expiresAt,
  });

  // Send verification email via Resend
  await sendVerificationOtpEmail(cleanEmail, otpCode);

  return {
    success: true,
    data: { email: cleanEmail },
    message: "Registration successful! Please verify your email code.",
  };
}

/**
 * Verifies 6-digit email OTP
 */
export async function verifyOtpAction(
  input: VerifyOtpInput
): Promise<ActionResult> {
  const parsed = verifyOtpSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid verification code.",
    };
  }

  const { email, code } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  // Rate limit OTP verification attempts
  const rateCheck = checkRateLimit(`verify:${cleanEmail}`, 5, 5 * 60 * 1000);
  if (!rateCheck.success) {
    return {
      success: false,
      error: "Too many failed attempts. Please wait 5 minutes before trying again.",
    };
  }

  // Find matching non-expired code
  const [validCodeRecord] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, cleanEmail),
        eq(verificationCodes.code, code),
        gt(verificationCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);

  if (!validCodeRecord) {
    return {
      success: false,
      error: "Invalid or expired verification code. Please request a new code.",
    };
  }

  // Mark user as email verified
  await db
    .update(users)
    .set({
      emailVerifiedAt: new Date(),
      trustScore: 20,
      updatedAt: new Date(),
    })
    .where(eq(users.email, cleanEmail));

  // Clean up verification codes for this email
  await db
    .delete(verificationCodes)
    .where(eq(verificationCodes.email, cleanEmail));

  return { success: true, message: "Email verified successfully! You can now sign in." };
}

/**
 * Resends a 6-digit verification code
 */
export async function resendOtpAction(
  email: string
): Promise<ActionResult> {
  const cleanEmail = email.toLowerCase().trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Valid email address is required." };
  }

  // Cooldown rate limit: max 1 request per 60 seconds
  const rateCheck = checkRateLimit(`resend:${cleanEmail}`, 1, 60 * 1000);
  if (!rateCheck.success) {
    return {
      success: false,
      error: "Please wait 60 seconds before requesting a new code.",
    };
  }

  const [user] = await db
    .select({ emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (!user) {
    return { success: false, error: "Account not found." };
  }

  if (user.emailVerifiedAt) {
    return { success: false, error: "Email is already verified. Please sign in." };
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(verificationCodes).values({
    email: cleanEmail,
    code: otpCode,
    expiresAt,
  });

  await sendVerificationOtpEmail(cleanEmail, otpCode);

  return { success: true, message: "New verification code sent to your email." };
}

/**
 * Requests a Password Reset link
 */
export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const { email } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  // Rate limit check
  const rateCheck = checkRateLimit(`forgot:${cleanEmail}`, 3, 15 * 60 * 1000);
  if (!rateCheck.success) {
    return {
      success: false,
      error: "Too many password reset requests. Please check your inbox or wait 15 minutes.",
    };
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  // Return success even if user not found to prevent user enumeration
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      email: cleanEmail,
      token,
      expiresAt,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(cleanEmail, resetUrl);
  }

  return {
    success: true,
    message: "If an account exists with that email, a password reset link has been sent.",
  };
}

/**
 * Sets a new password using a reset token
 */
export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid password data.",
    };
  }

  const { token, password } = parsed.data;

  // Find non-expired, unused token
  const [resetRecord] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!resetRecord) {
    return {
      success: false,
      error: "Password reset token is invalid or has expired. Please request a new link.",
    };
  }

  // Hash new password using Argon2
  const newPasswordHash = await hashPassword(password);

  // Update user's password in database
  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.email, resetRecord.email));

  // Mark token as used (single-use)
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetRecord.id));

  return {
    success: true,
    message: "Your password has been reset successfully! You can now sign in with your new password.",
  };
}

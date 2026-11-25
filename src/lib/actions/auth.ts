"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { eq, and, gt, isNull, desc, sql } from "drizzle-orm";
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
  resetPasswordWithOtpSchema,
  type SignUpInput,
  type SignInInput,
  type VerifyOtpInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ResetPasswordWithOtpInput,
} from "@/lib/validations/auth";

import { createInternalAuthToken } from "@/lib/auth-token";

type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; isUnverified?: boolean; email?: string };

/**
 * Robust Sign-In Action with Single-Pass Argon2 Verification & Email Verification Enforcement
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

  // Rate limit: 5 attempts per minute per email
  const rateLimit = checkRateLimit(`login:${cleanEmail}`, 5, 60 * 1000);
  if (!rateLimit.success) {
    return {
      success: false,
      error: `Too many sign-in attempts. Please wait ${Math.ceil(rateLimit.resetMs / 1000)}s before trying again.`,
    };
  }

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (!user) {
    return { success: false, error: "Invalid email address or password." };
  }

  // Verify password with Argon2 (Single Pass)
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

    const emailResult = await sendVerificationOtpEmail(cleanEmail, otpCode);
    if (!emailResult.success) {
      return {
        success: false,
        error: `Could not send verification email: ${emailResult.error}`,
      };
    }

    return {
      success: false,
      isUnverified: true,
      email: cleanEmail,
      error: "Your email address is not verified yet. A new 6-digit OTP code has been sent to your email.",
    };
  }

  // Generate short-lived HMAC token so Auth.js authorize() skips duplicate Argon2 verification
  const preVerifiedToken = createInternalAuthToken(user.id);

  // Sign in via Auth.js / NextAuth
  try {
    await signIn("credentials", {
      email: cleanEmail,
      password,
      preVerifiedToken,
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

      const emailResult = await sendVerificationOtpEmail(cleanEmail, otpCode);
      if (!emailResult.success) {
        return {
          success: false,
          error: `Could not send verification email: ${emailResult.error}`,
        };
      }

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

  // Send verification email via Brevo
  const emailResult = await sendVerificationOtpEmail(cleanEmail, otpCode);
  if (!emailResult.success) {
    return {
      success: false,
      error: `Registration completed, but could not send verification email: ${emailResult.error}`,
    };
  }

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

  // Mark user as email + student verified on OTP verification
  const [verifiedUser] = await db
    .select({
      id: users.id,
      emailVerifiedAt: users.emailVerifiedAt,
      trustScore: users.trustScore,
    })
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (verifiedUser) {
    await db
      .update(users)
      .set({
        emailVerifiedAt: verifiedUser.emailVerifiedAt ?? new Date(),
        studentStatus: "verified",
        trustScore: Math.max(verifiedUser.trustScore, 85),
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, verifiedUser.id));
  }

  // Clean up verification codes for this email
  await db
    .delete(verificationCodes)
    .where(eq(verificationCodes.email, cleanEmail));

  // Automatically sign the newly verified user in
  if (verifiedUser) {
    const preVerifiedToken = createInternalAuthToken(verifiedUser.id);
    try {
      await signIn("credentials", {
        email: cleanEmail,
        password: "__otp_verified__",
        preVerifiedToken,
        redirect: false,
      });
    } catch (error) {
      if (!(error instanceof AuthError)) {
        throw error;
      }
    }
  }

  return { success: true, message: "Account verified and signed in!" };
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

  const emailResult = await sendVerificationOtpEmail(cleanEmail, otpCode);
  if (!emailResult.success) {
    return {
      success: false,
      error: `Could not send verification email: ${emailResult.error}`,
    };
  }

  return { success: true, message: "New verification code sent to your email." };
}

async function resolveAppUrl(): Promise<string> {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";

  try {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    if (host) {
      const forwardedProto = headerList.get("x-forwarded-proto");
      const isLocalOrLan =
        host.startsWith("localhost") ||
        host.startsWith("127.0.0.1") ||
        host.startsWith("0.0.0.0") ||
        host.startsWith("192.168.") ||
        host.startsWith("10.") ||
        host.endsWith(":3000");
      const proto = forwardedProto || (isLocalOrLan ? "http" : "https");
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  } catch {
    // fallback to envUrl
  }

  return envUrl.replace(/\/+$/, "");
}

/**
 * Requests a Password Reset link and 6-digit reset code
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
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(sql`lower(${users.email}) = ${cleanEmail}`)
    .limit(1);

  // Return success even if user not found to prevent user enumeration
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const resetCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      email: user.email,
      token,
      expiresAt,
    });

    await db.insert(verificationCodes).values({
      email: cleanEmail,
      code: resetCode,
      expiresAt,
    });

    const appUrl = await resolveAppUrl();
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const emailResult = await sendPasswordResetEmail(cleanEmail, resetUrl, resetCode);
    if (!emailResult.success) {
      return {
        success: false,
        error: `Could not send password reset email: ${emailResult.error}`,
      };
    }
  }

  return {
    success: true,
    message: "If an account exists with that email, a password reset link and code have been sent.",
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
  const cleanToken = token.trim();

  // Hash new password using Argon2id
  const newPasswordHash = await hashPassword(password);

  const result = await db.transaction(async (tx) => {
    // Find non-expired, unused token
    const [resetRecord] = await tx
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, cleanToken),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetRecord) {
      return { error: "Password reset token is invalid or has expired. Please request a new link." };
    }

    const cleanRecordEmail = resetRecord.email.toLowerCase().trim();

    // Update user's password permanently in database
    const updatedUsers = await tx
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())`,
        updatedAt: new Date(),
      })
      .where(sql`lower(${users.email}) = ${cleanRecordEmail}`)
      .returning({ id: users.id });

    if (updatedUsers.length === 0) {
      return { error: "Account not found for this reset link." };
    }

    // Invalidate all open reset tokens and reset codes for this email
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          sql`lower(${passwordResetTokens.email}) = ${cleanRecordEmail}`,
          isNull(passwordResetTokens.usedAt)
        )
      );

    await tx
      .delete(verificationCodes)
      .where(eq(verificationCodes.email, cleanRecordEmail));

    return { ok: true as const };
  });

  if ("error" in result && result.error) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    message: "Your password has been reset successfully! You can now sign in with your new password.",
  };
}

/**
 * Sets a new password using the 6-digit reset code sent to the user's email
 */
export async function resetPasswordWithOtpAction(
  input: ResetPasswordWithOtpInput
): Promise<ActionResult> {
  const parsed = resetPasswordWithOtpSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid reset details.",
    };
  }

  const { email, code, password } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  const rateCheck = checkRateLimit(`reset-otp:${cleanEmail}`, 5, 5 * 60 * 1000);
  if (!rateCheck.success) {
    return {
      success: false,
      error: "Too many failed attempts. Please wait 5 minutes before trying again.",
    };
  }

  const newPasswordHash = await hashPassword(password);

  const result = await db.transaction(async (tx) => {
    const [validCode] = await tx
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

    if (!validCode) {
      return { error: "Invalid or expired reset code. Please request a new password reset email." };
    }

    const updatedUsers = await tx
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())`,
        updatedAt: new Date(),
      })
      .where(sql`lower(${users.email}) = ${cleanEmail}`)
      .returning({ id: users.id });

    if (updatedUsers.length === 0) {
      return { error: "Account not found." };
    }

    await tx
      .delete(verificationCodes)
      .where(eq(verificationCodes.email, cleanEmail));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          sql`lower(${passwordResetTokens.email}) = ${cleanEmail}`,
          isNull(passwordResetTokens.usedAt)
        )
      );

    return { ok: true as const };
  });

  if ("error" in result && result.error) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    message: "Your password has been reset successfully! You can now sign in with your new password.",
  };
}

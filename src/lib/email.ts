import "server-only";
import { logger } from "@/lib/logger";

function getEmailConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    process.env.FROM_EMAIL?.trim() ||
    "noreply@campuscart.com";
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "Campus Cart";

  return { apiKey, senderEmail, senderName };
}

/**
 * Sends a 6-digit email verification OTP to the user via Brevo REST API
 */
export async function sendVerificationOtpEmail(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const { apiKey, senderEmail, senderName } = getEmailConfig();

  // Redact OTP code in server logs (e.g. ***42) to prevent credential exposure
  const maskedCode = "***" + code.slice(-2);
  logger.info("EMAIL_OTP", `Sending OTP verification code to ${email}`, {
    email,
    code: maskedCode,
  });

  // Always log OTP to server terminal console in development/test so local testing is never blocked
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `\n========================================\n[DEV/LOCAL] CampusCart OTP for ${email}: ${code}\n========================================\n`
    );
  }

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    logger.warn(
      "BREVO",
      "BREVO_API_KEY is not configured in production. Email dispatch skipped."
    );
    return {
      success: false,
      error: "Email service is not configured (missing BREVO_API_KEY).",
    };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: `Your Campus Cart Verification Code: ${code}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4f46e5; margin-bottom: 16px; font-size: 22px;">Welcome to Campus Cart!</h2>
            <p style="font-size: 15px; color: #374151; line-height: 1.5;">Thank you for registering. Please enter the 6-digit verification code below to activate your student account:</p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${code}</span>
            </div>
            <p style="font-size: 13px; color: #6b7280;">This code will expire in 15 minutes. If you did not register for Campus Cart, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">Campus Cart — Student Marketplace</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      logger.error("BREVO_API", "Failed to send email via Brevo REST API", errorData);

      let userFriendlyError = errorData.message || "Failed to send verification email.";
      if (
        typeof userFriendlyError === "string" &&
        (userFriendlyError.includes("unrecognised IP") || userFriendlyError.includes("authorised_ips"))
      ) {
        userFriendlyError =
          "Brevo email service blocked this server's IP address. Please authorize the IP or disable IP restrictions in your Brevo Security settings (https://app.brevo.com/security/authorised_ips).";
      }

      // In local development, don't fail registration if console log OTP is available
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[BREVO WARNING] Email API returned error (${userFriendlyError}), but OTP was logged above for local development.`
        );
        return { success: true };
      }

      return { success: false, error: userFriendlyError };
    }

    logger.info("BREVO", `Verification email successfully delivered to ${email}`);
    return { success: true };
  } catch (err: unknown) {
    logger.error("BREVO_EX", "Exception during email dispatch", err);

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[BREVO EXCEPTION] Email dispatch failed, but OTP was logged above for local development.`
      );
      return { success: true };
    }

    return { success: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

/**
 * Sends a password reset link to the user via Brevo REST API
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const { apiKey, senderEmail, senderName } = getEmailConfig();
  logger.info("EMAIL_RESET", `Sending password reset email to ${email}`, { email });

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `\n========================================\n[DEV/LOCAL] Password Reset URL for ${email}: ${resetUrl}\n========================================\n`
    );
  }

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    logger.warn(
      "BREVO",
      "BREVO_API_KEY is not configured in production. Password reset email skipped."
    );
    return { success: false, error: "Email service is not configured (missing BREVO_API_KEY)." };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: "Reset your Campus Cart Password",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4f46e5; margin-bottom: 16px; font-size: 22px;">Campus Cart Password Reset</h2>
            <p style="font-size: 15px; color: #374151; line-height: 1.5;">We received a request to reset your Campus Cart password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #6b7280;">If the button above does not work, copy and paste this link into your browser:</p>
            <p style="font-size: 13px; word-break: break-all; color: #4f46e5;">${resetUrl}</p>
            <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">This single-use link will expire in 15 minutes.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">Campus Cart — Student Marketplace</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      logger.error("BREVO_RESET", "Brevo Password Reset Error", errorData);

      let userFriendlyError = errorData.message || "Failed to send password reset email.";
      if (
        typeof userFriendlyError === "string" &&
        (userFriendlyError.includes("unrecognised IP") || userFriendlyError.includes("authorised_ips"))
      ) {
        userFriendlyError =
          "Brevo email service blocked this server's IP address. Please authorize the IP or disable IP restrictions in your Brevo Security settings (https://app.brevo.com/security/authorised_ips).";
      }

      if (process.env.NODE_ENV !== "production") {
        return { success: true };
      }

      return { success: false, error: userFriendlyError };
    }

    logger.info("BREVO", `Password reset email successfully delivered to ${email}`);
    return { success: true };
  } catch (err: unknown) {
    logger.error("BREVO_RESET_EX", "Password reset email sending exception", err);

    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }

    return { success: false, error: err instanceof Error ? err.message : "Failed to send password reset email" };
  }
}


import "server-only";
import { logger } from "@/lib/logger";

const brevoApiKey = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.FROM_EMAIL || "noreply@campuscart.com";
const SENDER_NAME = "Campus Cart";

/**
 * Sends a 6-digit email verification OTP to the user via Brevo REST API
 */
export async function sendVerificationOtpEmail(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  // Redact OTP code in server logs (e.g. ***42) to prevent credential exposure
  const maskedCode = "***" + code.slice(-2);
  logger.info("EMAIL_OTP", `Sending OTP verification code to ${email}`, {
    email,
    code: maskedCode,
  });

  if (!brevoApiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `\n[DEV ONLY] Verification OTP for ${email}: ${code}\n`
      );
    } else {
      logger.warn(
        "BREVO",
        "BREVO_API_KEY is not configured in production. Email dispatch skipped."
      );
    }
    return { success: true };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL,
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
      return { success: false, error: errorData.message || "Failed to send email via Brevo" };
    }

    logger.info("BREVO", `Verification email successfully delivered to ${email}`);
    return { success: true };
  } catch (err: unknown) {
    logger.error("BREVO_EX", "Exception during email dispatch", err);
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
  logger.info("EMAIL_RESET", `Sending password reset email to ${email}`, { email });

  if (!brevoApiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `\n[DEV ONLY] Password Reset URL for ${email}: ${resetUrl}\n`
      );
    } else {
      logger.warn(
        "BREVO",
        "BREVO_API_KEY is not configured in production. Password reset email skipped."
      );
    }
    return { success: true };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL,
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
      return { success: false, error: errorData.message || "Failed to send password reset email via Brevo" };
    }

    logger.info("BREVO", `Password reset email successfully delivered to ${email}`);
    return { success: true };
  } catch (err: unknown) {
    logger.error("BREVO_RESET_EX", "Password reset email sending exception", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to send password reset email" };
  }
}


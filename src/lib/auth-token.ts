import "server-only";
import crypto from "crypto";

const TOKEN_VALIDITY_MS = 30_000; // 30 seconds

/**
 * Creates a short-lived cryptographic HMAC token confirming that
 * password verification was already completed by the server action.
 */
export function createInternalAuthToken(userId: string): string {
  const secret = process.env.AUTH_SECRET || "cc-internal-auth-token-secret";
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${hmac}`;
}

/**
 * Verifies the internal HMAC token and ensures it has not expired.
 */
export function verifyInternalAuthToken(
  token: string | undefined | null,
  expectedUserId: string
): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [userId, timestampStr, hmac] = parts;
  if (userId !== expectedUserId) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (
    isNaN(timestamp) ||
    Date.now() - timestamp > TOKEN_VALIDITY_MS ||
    Date.now() < timestamp - 5000
  ) {
    return false;
  }

  const secret = process.env.AUTH_SECRET || "cc-internal-auth-token-secret";
  const payload = `${userId}:${timestampStr}`;
  const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(expectedHmac, "hex")
    );
  } catch {
    return false;
  }
}

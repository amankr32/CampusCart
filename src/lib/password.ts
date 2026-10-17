import "server-only";
import argon2 from "argon2";
import bcrypt from "bcryptjs";

/**
 * Hashes a plain password using Argon2id (secure production default)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verifies a plain password against an Argon2 or legacy Bcrypt hash
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  if (!passwordHash || !plainPassword) return false;

  try {
    // Check if hash is legacy Bcrypt ($2a$, $2b$, $2y$)
    if (passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$")) {
      return await bcrypt.compare(plainPassword, passwordHash);
    }
    // Verify with Argon2
    return await argon2.verify(passwordHash, plainPassword);
  } catch {
    try {
      // Fallback fallback attempt with bcrypt in case of format anomaly
      return await bcrypt.compare(plainPassword, passwordHash);
    } catch {
      return false;
    }
  }
}

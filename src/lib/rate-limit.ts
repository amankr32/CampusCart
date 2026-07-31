import "server-only";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter helper
 * @param key unique identifier (e.g. `otp:${email}` or `ip:${ip}`)
 * @param limit max allowed attempts within window
 * @param windowMs window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetMs: Math.max(0, record.resetAt - now),
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetMs: Math.max(0, record.resetAt - now),
  };
}

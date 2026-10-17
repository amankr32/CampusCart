/**
 * Normalizes a PostgreSQL connection URL.
 * When a Neon direct endpoint is supplied, it automatically routes through
 * Neon's pooled endpoint (-pooler) to prevent cold-start disconnects and connection exhaustion.
 */
export function resolveDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;

  // Check if this is a Neon direct endpoint without -pooler
  if (rawUrl.includes(".neon.tech") && !rawUrl.includes("-pooler")) {
    return rawUrl.replace(/(ep-[\w-]+)(\.[^/]+)/, "$1-pooler$2");
  }

  return rawUrl;
}

/**
 * Returns whether the current runtime environment is a serverless platform (e.g. Vercel)
 * where HTTP fetch queries from @neondatabase/serverless should be preferred
 * to avoid TCP connection handshake latency and socket cold starts.
 */
export function shouldUseNeonServerless(
  env: Record<string, string | undefined> = process.env,
  connectionUrl?: string
): boolean {
  const url = connectionUrl || env.DATABASE_URL || "";
  const isNeon = url.includes(".neon.tech");
  if (!isNeon) return false;

  return Boolean(
    env.VERCEL ||
    env.AWS_LAMBDA_FUNCTION_NAME ||
    env.USE_NEON_SERVERLESS === "true" ||
    env.DATABASE_DRIVER === "neon"
  );
}


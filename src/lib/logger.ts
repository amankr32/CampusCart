type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogPayload {
  level: LogLevel;
  timestamp: string;
  scope: string;
  message: string;
  details?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Redacts sensitive fields (passwords, tokens, keys) from logged details
 */
function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("token") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("key")
    ) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatLog(
  level: LogLevel,
  scope: string,
  message: string,
  details?: unknown,
  err?: unknown
): LogPayload {
  const payload: LogPayload = {
    level,
    timestamp: new Date().toISOString(),
    scope,
    message,
  };

  if (details !== undefined) {
    payload.details = sanitize(details);
  }

  if (err) {
    if (err instanceof Error) {
      payload.error = {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      };
    } else {
      payload.error = {
        name: "UnknownError",
        message: String(err),
      };
    }
  }

  return payload;
}

export const logger = {
  debug(scope: string, message: string, details?: unknown) {
    if (process.env.NODE_ENV === "development") {
      const payload = formatLog("DEBUG", scope, message, details);
      console.log(`[DEBUG] [${payload.scope}] ${payload.message}`, payload.details ?? "");
    }
  },

  info(scope: string, message: string, details?: unknown) {
    const payload = formatLog("INFO", scope, message, details);
    console.log(`[INFO] [${payload.scope}] ${payload.message}`, payload.details ?? "");
  },

  warn(scope: string, message: string, details?: unknown) {
    const payload = formatLog("WARN", scope, message, details);
    console.warn(`[WARN] [${payload.scope}] ${payload.message}`, payload.details ?? "");
  },

  error(scope: string, message: string, err?: unknown, details?: unknown) {
    const payload = formatLog("ERROR", scope, message, details, err);
    console.error(`[ERROR] [${payload.scope}] ${payload.message}`, payload.error ?? "", payload.details ?? "");
  },
};

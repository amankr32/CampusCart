import "server-only";
import { logger } from "@/lib/logger";

export type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; code?: string; isUnverified?: boolean; email?: string };

/**
 * Wraps a server action function with production logging and exception isolation
 */
export async function executeServerAction<T>(
  actionName: string,
  fn: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err: unknown) {
    logger.error(actionName, `Unhandled server action exception`, err);
    return {
      success: false,
      error: "An unexpected system error occurred. Please try again or contact support.",
    };
  }
}

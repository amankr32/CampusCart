import "server-only";

/**
 * Ephemeral "who's typing" state, kept in memory rather than the database
 * since it's high-frequency and doesn't need to survive a restart.
 *
 * Note: this only works within a single Node process. It's fine for this
 * app's deployment (one `next start` process), but wouldn't sync across
 * multiple server instances — that would need a shared store like Redis.
 */

const TYPING_TIMEOUT_MS = 5000;

interface TypingEntry {
  userId: string;
  expiresAt: number;
}

const globalForTyping = globalThis as unknown as {
  typingByConversation: Map<string, TypingEntry> | undefined;
};

const typingByConversation =
  globalForTyping.typingByConversation ?? new Map<string, TypingEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForTyping.typingByConversation = typingByConversation;
}

export function setTyping(conversationId: string, userId: string) {
  typingByConversation.set(conversationId, {
    userId,
    expiresAt: Date.now() + TYPING_TIMEOUT_MS,
  });
}

export function clearTyping(conversationId: string, userId: string) {
  const entry = typingByConversation.get(conversationId);
  if (entry?.userId === userId) {
    typingByConversation.delete(conversationId);
  }
}

/** Returns the userId currently typing in this conversation, if any and not stale. */
export function getTypingUserId(conversationId: string): string | null {
  const entry = typingByConversation.get(conversationId);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    typingByConversation.delete(conversationId);
    return null;
  }

  return entry.userId;
}

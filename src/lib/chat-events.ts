import "server-only";
import { EventEmitter } from "node:events";

export type ChatEventType = "message" | "typing" | "order" | "read" | "presence";

export interface ChatEvent {
  type: ChatEventType;
  conversationId: string;
  data: unknown;
}

type ChatEventListener = (event: ChatEvent) => void;

const globalForChat = globalThis as unknown as {
  chatEmitter: EventEmitter | undefined;
};

const chatEmitter = globalForChat.chatEmitter ?? new EventEmitter();
chatEmitter.setMaxListeners(250);

if (process.env.NODE_ENV !== "production") {
  globalForChat.chatEmitter = chatEmitter;
}

/**
 * Publishes a real-time chat event to all active SSE subscribers of a conversation.
 */
export function publishChatEvent(
  conversationId: string,
  event: Omit<ChatEvent, "conversationId">
) {
  chatEmitter.emit(`chat:${conversationId}`, { ...event, conversationId });
}

/**
 * Subscribes an SSE connection to real-time events for a specific conversation.
 * Returns an unsubscribe callback for connection cleanup.
 */
export function subscribeToChatEvents(
  conversationId: string,
  listener: ChatEventListener
): () => void {
  const eventName = `chat:${conversationId}`;
  chatEmitter.on(eventName, listener);
  return () => {
    chatEmitter.off(eventName, listener);
  };
}

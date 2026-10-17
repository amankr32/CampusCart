import { auth } from "@/auth";
import { getConversationMembers } from "@/db/queries/messages";
import { subscribeToChatEvents, type ChatEvent } from "@/lib/chat-events";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Sign in required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id: conversationId } = await params;
    const conversation = await getConversationMembers(conversationId);

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      conversation.buyerId !== session.user.id &&
      conversation.sellerId !== session.user.id
    ) {
      return new Response(JSON.stringify({ error: "Forbidden." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream({
      start(controller) {
        // Initial connection confirmation
        try {
          controller.enqueue(
            encoder.encode(
              `event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`
            )
          );
        } catch {
          return;
        }

        // Forward published chat events to SSE client
        const onEvent = (event: ChatEvent) => {
          try {
            const chunk = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          } catch {
            // Stream controller already closed
          }
        };

        const unsubscribe = subscribeToChatEvents(conversationId, onEvent);

        // Keep-alive heartbeat every 15s to keep proxy connections alive
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            clearInterval(keepAlive);
          }
        }, 15_000);

        cleanup = () => {
          unsubscribe();
          clearInterval(keepAlive);
        };

        // Handle client abort / disconnect
        request.signal.addEventListener("abort", () => {
          cleanup?.();
          try {
            controller.close();
          } catch {}
        });
      },
      cancel() {
        cleanup?.();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    logger.error("API_CHAT_STREAM", "Failed to initialize SSE stream", error);
    return new Response(JSON.stringify({ error: "Failed to connect to stream." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

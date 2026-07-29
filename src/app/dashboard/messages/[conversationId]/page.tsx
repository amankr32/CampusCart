import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { getConversationDetail, listMessages } from "@/db/queries/messages";
import { getActiveOrderForConversation } from "@/db/queries/orders";
import { getReviewForOrder } from "@/db/queries/products";
import { ChatWindow } from "@/components/messaging/chat-window";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const { conversationId } = await params;
  const conversation = await getConversationDetail(conversationId);

  if (!conversation) {
    notFound();
  }

  // Only the buyer or seller in this thread may view it.
  if (
    conversation.buyerId !== session.user.id &&
    conversation.sellerId !== session.user.id
  ) {
    notFound();
  }

  const isBuyer = conversation.buyerId === session.user.id;
  const otherUser = isBuyer ? conversation.seller : conversation.buyer;

  const [messages, order] = await Promise.all([
    listMessages(conversationId),
    getActiveOrderForConversation(conversationId),
  ]);

  const hasReviewed =
    order && order.status === "completed"
      ? await getReviewForOrder(order.id, session.user.id)
      : false;

  return (
    <ChatWindow
      conversationId={conversationId}
      currentUserId={session.user.id}
      role={isBuyer ? "buyer" : "seller"}
      otherUser={{
        id: otherUser.id,
        name: otherUser.name,
        username: otherUser.username,
      }}
      product={{
        name: conversation.product.name,
        slug: conversation.product.slug,
        priceCents: conversation.product.priceCents,
        image: conversation.product.images?.[0] ?? null,
        status: conversation.product.status,
      }}
      initialMessages={messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))}
      initialOrder={
        order
          ? {
              id: order.id,
              status: order.status as "seller_confirmed" | "completed",
              buyerId: order.buyerId,
            }
          : null
      }
      hasReviewed={hasReviewed}
    />
  );
}

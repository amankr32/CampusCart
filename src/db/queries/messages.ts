import "server-only";
import { and, desc, eq, gt, inArray, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { conversations, messages, products, users } from "@/db/schema";
import { publishChatEvent } from "@/lib/chat-events";

const RECENT_MESSAGES_LIMIT = 50;

function visibleToUserCondition(userId: string) {
  return sql`NOT (${messages.deletedByUserIds} @> ${JSON.stringify([userId])}::jsonb)`;
}

/**
 * Returns the existing conversation for this buyer+seller+product, or
 * creates one. Safe to call concurrently — relies on the unique index on
 * (buyerId, sellerId, productId) and just re-reads on a conflict.
 */
export async function getOrCreateConversation({
  productId,
  buyerId,
  sellerId,
}: {
  productId: string;
  buyerId: string;
  sellerId: string;
}) {
  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.productId, productId),
        eq(conversations.buyerId, buyerId),
        eq(conversations.sellerId, sellerId)
      )
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(conversations)
    .values({ productId, buyerId, sellerId })
    .onConflictDoNothing({
      target: [
        conversations.buyerId,
        conversations.sellerId,
        conversations.productId,
      ],
    })
    .returning();

  if (created) {
    return created;
  }

  // Someone else won the race and inserted first — read what they created.
  const [raceWinner] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.productId, productId),
        eq(conversations.buyerId, buyerId),
        eq(conversations.sellerId, sellerId)
      )
    )
    .limit(1);

  return raceWinner;
}

/**
 * Fetches a conversation along with enough product/buyer/seller detail to
 * render the chat header and to run membership/ownership checks.
 */
export async function getConversationDetail(conversationId: string) {
  const [row] = await db
    .select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        priceCents: products.priceCents,
        images: products.images,
        status: products.status,
        isArchived: products.isArchived,
      },
      buyer: {
        id: users.id,
        name: users.name,
        username: users.username,
      },
    })
    .from(conversations)
    .innerJoin(products, eq(conversations.productId, products.id))
    .innerJoin(users, eq(conversations.buyerId, users.id))
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!row) {
    return null;
  }

  const [[seller], [buyerPresence]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        lastActiveAt: users.lastActiveAt,
      })
      .from(users)
      .where(eq(users.id, row.sellerId))
      .limit(1),
    db
      .select({ lastActiveAt: users.lastActiveAt })
      .from(users)
      .where(eq(users.id, row.buyerId))
      .limit(1),
  ]);

  return {
    ...row,
    buyer: { ...row.buyer, lastActiveAt: buyerPresence?.lastActiveAt ?? null },
    seller,
  };
}


/** Lightweight membership check — participant ids plus the product being discussed. */
export async function getConversationMembers(conversationId: string) {
  const [row] = await db
    .select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      productId: conversations.productId,
    })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  return row ?? null;
}

/** Recent message history for a conversation, oldest first. */
export async function listMessages(conversationId: string, userId?: string) {
  const rows = await db
    .select()
    .from(messages)
    .where(
      userId
        ? and(
            eq(messages.conversationId, conversationId),
            visibleToUserCondition(userId)
          )
        : eq(messages.conversationId, conversationId)
    )
    .orderBy(desc(messages.createdAt))
    .limit(RECENT_MESSAGES_LIMIT);

  return rows.reverse();
}

/** Messages created after a given timestamp — used by the poll endpoint. */
export async function listMessagesAfter(
  conversationId: string,
  after: Date,
  userId?: string
) {
  return db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        gt(messages.createdAt, after),
        userId ? visibleToUserCondition(userId) : undefined
      )
    )
    .orderBy(messages.createdAt);
}

export async function sendMessage({
  conversationId,
  senderId,
  message,
  image,
  type = "text",
}: {
  conversationId: string;
  senderId: string;
  message: string | null;
  image: string | null;
  type?: "text" | "system";
}) {
  const [created] = await db
    .insert(messages)
    .values({ conversationId, senderId, message, image, type })
    .returning();

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  publishChatEvent(conversationId, {
    type: "message",
    data: created,
  });

  return created;
}

/** Inserts an app-generated system message ("Seller marked as sold", etc). */
export async function sendSystemMessage(
  conversationId: string,
  authorId: string,
  message: string
) {
  return sendMessage({
    conversationId,
    senderId: authorId,
    message,
    image: null,
    type: "system",
  });
}

/** Marks every message from the other party as read. */
export async function markConversationRead(
  conversationId: string,
  readerId: string
) {
  await db
    .update(messages)
    .set({ isRead: true })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, readerId),
        eq(messages.isRead, false)
      )
    );

  publishChatEvent(conversationId, {
    type: "read",
    data: { readerId },
  });
}

/** Edits a text message authored by userId (not deleted for everyone). */
export async function editMessage({
  conversationId,
  messageId,
  userId,
  message,
}: {
  conversationId: string;
  messageId: string;
  userId: string;
  message: string;
}) {
  const [existing] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.conversationId, conversationId)
      )
    )
    .limit(1);

  if (!existing) {
    return { error: "Message not found.", status: 404 as const };
  }

  if (existing.senderId !== userId) {
    return { error: "You can only edit your own messages.", status: 403 as const };
  }

  if (existing.type !== "text") {
    return { error: "System messages cannot be edited.", status: 400 as const };
  }

  if (existing.deletedForEveryoneAt) {
    return { error: "Deleted messages cannot be edited.", status: 400 as const };
  }

  const [updated] = await db
    .update(messages)
    .set({
      message,
      editedAt: new Date(),
    })
    .where(eq(messages.id, messageId))
    .returning();

  publishChatEvent(conversationId, {
    type: "message_updated",
    data: updated,
  });

  return { message: updated };
}

/** Hides a message for the current user only ("Delete for me"). */
export async function deleteMessageForMe({
  conversationId,
  messageId,
  userId,
}: {
  conversationId: string;
  messageId: string;
  userId: string;
}) {
  const [existing] = await db
    .select({
      id: messages.id,
      deletedByUserIds: messages.deletedByUserIds,
    })
    .from(messages)
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.conversationId, conversationId)
      )
    )
    .limit(1);

  if (!existing) {
    return { error: "Message not found.", status: 404 as const };
  }

  const currentList = Array.isArray(existing.deletedByUserIds)
    ? existing.deletedByUserIds
    : [];

  if (!currentList.includes(userId)) {
    await db
      .update(messages)
      .set({
        deletedByUserIds: [...currentList, userId],
      })
      .where(eq(messages.id, messageId));
  }

  return { ok: true as const };
}

/** Deletes a message for all participants ("Delete for everyone"). */
export async function deleteMessageForEveryone({
  conversationId,
  messageId,
  userId,
}: {
  conversationId: string;
  messageId: string;
  userId: string;
}) {
  const [existing] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.conversationId, conversationId)
      )
    )
    .limit(1);

  if (!existing) {
    return { error: "Message not found.", status: 404 as const };
  }

  if (existing.senderId !== userId) {
    return {
      error: "You can only delete your own messages for everyone.",
      status: 403 as const,
    };
  }

  if (existing.type !== "text") {
    return {
      error: "System messages cannot be deleted for everyone.",
      status: 400 as const,
    };
  }

  const [updated] = await db
    .update(messages)
    .set({
      message: null,
      image: null,
      isRead: true,
      deletedForEveryoneAt: existing.deletedForEveryoneAt ?? new Date(),
    })
    .where(eq(messages.id, messageId))
    .returning();

  publishChatEvent(conversationId, {
    type: "message_updated",
    data: updated,
  });

  return { message: updated, previousImage: existing.image };
}

/**
 * Conversation list for a user's inbox: the other party, the product, the
 * last message, and an unread count — all without an N+1 query per thread.
 */
export async function listConversationsForUser(userId: string) {
  const threads = await db
    .select({
      id: conversations.id,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      updatedAt: conversations.updatedAt,
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        priceCents: products.priceCents,
        images: products.images,
      },
    })
    .from(conversations)
    .innerJoin(products, eq(conversations.productId, products.id))
    .where(
      sql`${conversations.buyerId} = ${userId} OR ${conversations.sellerId} = ${userId}`
    )
    .orderBy(desc(conversations.updatedAt));

  if (threads.length === 0) {
    return [];
  }

  const conversationIds = threads.map((t) => t.id);
  const otherUserIds = threads.map((t) =>
    t.buyerId === userId ? t.sellerId : t.buyerId
  );

  const [otherUsers, unreadCounts] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, username: users.username })
      .from(users)
      .where(inArray(users.id, otherUserIds)),
    db
      .select({
        conversationId: messages.conversationId,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .where(
        and(
          inArray(messages.conversationId, conversationIds),
          ne(messages.senderId, userId),
          eq(messages.isRead, false),
          isNull(messages.deletedForEveryoneAt),
          visibleToUserCondition(userId)
        )
      )
      .groupBy(messages.conversationId),
  ]);

  // Latest message per conversation via DISTINCT ON, in one query rather
  // than one per thread.
  const latestRows = await db
    .selectDistinctOn([messages.conversationId], {
      conversationId: messages.conversationId,
      message: messages.message,
      image: messages.image,
      senderId: messages.senderId,
      deletedForEveryoneAt: messages.deletedForEveryoneAt,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        visibleToUserCondition(userId)
      )
    )
    .orderBy(messages.conversationId, desc(messages.createdAt));

  const otherUserById = new Map(otherUsers.map((u) => [u.id, u]));
  const lastMessageByConversation = new Map(
    latestRows.map((m) => [m.conversationId, m])
  );
  const unreadByConversation = new Map(
    unreadCounts.map((u) => [u.conversationId, u.count])
  );

  return threads.map((thread) => {
    const otherUserId =
      thread.buyerId === userId ? thread.sellerId : thread.buyerId;

    return {
      id: thread.id,
      role: thread.buyerId === userId ? ("buyer" as const) : ("seller" as const),
      product: thread.product,
      otherUser: otherUserById.get(otherUserId) ?? null,
      lastMessage: lastMessageByConversation.get(thread.id) ?? null,
      unreadCount: unreadByConversation.get(thread.id) ?? 0,
      updatedAt: thread.updatedAt,
    };
  });
}

export type ConversationSummary = Awaited<
  ReturnType<typeof listConversationsForUser>
>[number];

export async function countUnreadMessagesForUser(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        sql`${conversations.buyerId} = ${userId} OR ${conversations.sellerId} = ${userId}`,
        ne(messages.senderId, userId),
        eq(messages.isRead, false),
        isNull(messages.deletedForEveryoneAt),
        visibleToUserCondition(userId)
      )
    );

  return row?.count ?? 0;
}

export async function touchUserPresence(userId: string) {
  await db
    .update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, userId));
}

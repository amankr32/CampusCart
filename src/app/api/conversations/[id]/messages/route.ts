import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getConversationMembers,
  listMessages,
  listMessagesAfter,
  markConversationRead,
  sendMessage,
} from "@/db/queries/messages";
import { getActiveOrderForConversation } from "@/db/queries/orders";
import { getTypingUserId } from "@/lib/typing-store";

const ONLINE_WINDOW_MS = 45_000;

async function requireMembership(conversationId: string, userId: string) {
  const conversation = await getConversationMembers(conversationId);
  if (!conversation) {
    return { error: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  }
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    return {
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }
  return { conversation };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const { conversation, error } = await requireMembership(id, session.user.id);
  if (error) return error;

  const url = new URL(request.url);
  const after = url.searchParams.get("after");

  const [newMessages, activeOrder] = await Promise.all([
    after ? listMessagesAfter(id, new Date(after)) : listMessages(id),
    getActiveOrderForConversation(id),
  ]);
  // The viewer is actively looking at the thread, so whatever the other
  // party has sent so far is now read.
  await markConversationRead(id, session.user.id);

  const otherUserId =
    conversation!.buyerId === session.user.id
      ? conversation!.sellerId
      : conversation!.buyerId;

  const [otherUserRow] = await db
    .select({ lastActiveAt: users.lastActiveAt })
    .from(users)
    .where(eq(users.id, otherUserId))
    .limit(1);

  const lastActiveAt = otherUserRow?.lastActiveAt ?? null;
  const isOnline = lastActiveAt
    ? Date.now() - new Date(lastActiveAt).getTime() < ONLINE_WINDOW_MS
    : false;
  const isTyping = getTypingUserId(id) === otherUserId;

  return NextResponse.json({
    messages: newMessages,
    otherUser: { id: otherUserId, isOnline, lastActiveAt, isTyping },
    order: activeOrder,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await requireMembership(id, session.user.id);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const message =
    typeof body?.message === "string" && body.message.trim().length > 0
      ? body.message.trim().slice(0, 2000)
      : null;
  const image = typeof body?.image === "string" ? body.image : null;

  if (!message && !image) {
    return NextResponse.json(
      { error: "Message can't be empty." },
      { status: 400 }
    );
  }

  const created = await sendMessage({
    conversationId: id,
    senderId: session.user.id,
    message,
    image,
  });

  return NextResponse.json({ message: created }, { status: 201 });
}

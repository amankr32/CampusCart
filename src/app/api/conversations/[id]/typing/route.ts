import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getConversationMembers } from "@/db/queries/messages";
import { clearTyping, setTyping } from "@/lib/typing-store";
import { publishChatEvent } from "@/lib/chat-events";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getConversationMembers(id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (
      conversation.buyerId !== session.user.id &&
      conversation.sellerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const isTyping = !!body?.isTyping;

    if (isTyping) {
      setTyping(id, session.user.id);
    } else {
      clearTyping(id, session.user.id);
    }

    publishChatEvent(id, {
      type: "typing",
      data: { userId: session.user.id, isTyping },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("API_TYPING", "Failed to update typing state", error);
    return NextResponse.json({ error: "Failed to update typing status." }, { status: 500 });
  }
}

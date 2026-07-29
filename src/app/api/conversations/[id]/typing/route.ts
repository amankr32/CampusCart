import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getConversationMembers } from "@/db/queries/messages";
import { clearTyping, setTyping } from "@/lib/typing-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (body?.isTyping) {
    setTyping(id, session.user.id);
  } else {
    clearTyping(id, session.user.id);
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

import { auth } from "@/auth";
import {
  deleteMessageForEveryone,
  deleteMessageForMe,
  editMessage,
  getConversationMembers,
} from "@/db/queries/messages";
import { logger } from "@/lib/logger";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id, messageId } = await params;
    const { error } = await requireMembership(id, session.user.id);
    if (error) return error;

    const body = await request.json().catch(() => null);
    const trimmed =
      typeof body?.message === "string" ? body.message.trim().slice(0, 2000) : "";

    if (!trimmed) {
      return NextResponse.json(
        { error: "Message text cannot be empty." },
        { status: 400 }
      );
    }

    const result = await editMessage({
      conversationId: id,
      messageId,
      userId: session.user.id,
      message: trimmed,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (err) {
    logger.error("API_MESSAGE_PATCH", "Failed to edit message", err);
    return NextResponse.json(
      { error: "Failed to edit message." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id, messageId } = await params;
    const { error } = await requireMembership(id, session.user.id);
    if (error) return error;

    const url = new URL(request.url);
    let scope = url.searchParams.get("scope");

    if (!scope) {
      const body = await request.json().catch(() => null);
      if (typeof body?.scope === "string") {
        scope = body.scope;
      }
    }

    if (scope !== "me" && scope !== "everyone") {
      return NextResponse.json(
        { error: 'Delete scope must be "me" or "everyone".' },
        { status: 400 }
      );
    }

    if (scope === "me") {
      const result = await deleteMessageForMe({
        conversationId: id,
        messageId,
        userId: session.user.id,
      });

      if ("error" in result) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status }
        );
      }

      return NextResponse.json({ ok: true, scope: "me" });
    }

    const result = await deleteMessageForEveryone({
      conversationId: id,
      messageId,
      userId: session.user.id,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    if (
      typeof result.previousImage === "string" &&
      result.previousImage.includes("vercel-storage.com")
    ) {
      try {
        await del(result.previousImage);
      } catch (e) {
        logger.error("CHAT_BLOB_DELETE", "Failed to delete message image", e, {
          url: result.previousImage,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      scope: "everyone",
      message: result.message,
    });
  } catch (err) {
    logger.error("API_MESSAGE_DELETE", "Failed to delete message", err);
    return NextResponse.json(
      { error: "Failed to delete message." },
      { status: 500 }
    );
  }
}

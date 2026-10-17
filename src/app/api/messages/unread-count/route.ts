import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { countUnreadMessagesForUser } from "@/db/queries/messages";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ count: 0 });
    }

    const count = await countUnreadMessagesForUser(session.user.id);
    return NextResponse.json(
      { count },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    logger.error("API_UNREAD_COUNT", "Failed to get unread message count", error);
    return NextResponse.json({ count: 0 });
  }
}

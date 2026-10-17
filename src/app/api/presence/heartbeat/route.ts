import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { touchUserPresence } from "@/db/queries/messages";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    await touchUserPresence(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("API_HEARTBEAT", "Failed to update user presence", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

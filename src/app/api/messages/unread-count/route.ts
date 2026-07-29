import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { countUnreadMessagesForUser } from "@/db/queries/messages";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await countUnreadMessagesForUser(session.user.id);
  return NextResponse.json({ count });
}

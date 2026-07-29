import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { touchUserPresence } from "@/db/queries/messages";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await touchUserPresence(session.user.id);
  return NextResponse.json({ ok: true });
}

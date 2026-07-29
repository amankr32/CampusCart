import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { products, tenants } from "@/db/schema";
import {
  getOrCreateConversation,
  listConversationsForUser,
} from "@/db/queries/messages";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const conversations = await listConversationsForUser(session.user.id);
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = body?.productId;

  if (!productId || typeof productId !== "string") {
    return NextResponse.json(
      { error: "A productId is required." },
      { status: 400 }
    );
  }

  const [product] = await db
    .select({
      id: products.id,
      tenantId: products.tenantId,
      ownerId: tenants.ownerId,
      status: products.status,
    })
    .from(products)
    .innerJoin(tenants, eq(products.tenantId, tenants.id))
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (product.ownerId === session.user.id) {
    return NextResponse.json(
      { error: "You can't message yourself about your own listing." },
      { status: 400 }
    );
  }

  if (product.status === "sold") {
    return NextResponse.json(
      { error: "This item has already been sold." },
      { status: 400 }
    );
  }

  const conversation = await getOrCreateConversation({
    productId: product.id,
    buyerId: session.user.id,
    sellerId: product.ownerId,
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Couldn't start the conversation. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}

import { NextResponse } from "next/server";
import { searchProductsQuick } from "@/db/queries/products";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchProductsQuick(query, 8);
    return NextResponse.json(
      { results },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    logger.error("API_SEARCH", "Quick search endpoint encountered an error", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

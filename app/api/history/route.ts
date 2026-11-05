import { NextResponse } from "next/server";
import { demoHistory } from "@/app/lib/demo-markets";

/**
 * Odds history API.
 * Phase A scaffold: serves demo series with cache headers.
 * After Testnet deploy: index trade events from Soroban RPC incrementally
 * (stale-while-revalidate; never N+1 from every card).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "1";

  const data = demoHistory();

  return NextResponse.json(data, {
    headers: {
      "x-history-cache": refresh ? "fresh" : "hit",
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
    },
  });
}

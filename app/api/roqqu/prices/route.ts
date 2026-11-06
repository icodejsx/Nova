import { NextResponse } from "next/server";
import { getPrices } from "@/app/lib/roqqu/server";

let cached: { at: number; body: Awaited<ReturnType<typeof getPrices>> } | null = null;
const CACHE_MS = 30_000;

export async function GET() {
  const now = Date.now();
  if (!cached || now - cached.at > CACHE_MS) {
    cached = { at: now, body: await getPrices() };
  }
  return NextResponse.json(cached.body, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}

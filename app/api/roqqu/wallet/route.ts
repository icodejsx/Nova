import { NextResponse } from "next/server";
import { getWallet } from "@/app/lib/roqqu/server";

export async function GET() {
  return NextResponse.json(await getWallet(), {
    headers: { "Cache-Control": "no-store" },
  });
}

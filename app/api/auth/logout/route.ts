import { NextResponse } from "next/server";
import { endSession } from "@/app/lib/auth/session";

export async function POST() {
  await endSession();
  return NextResponse.json({ signedIn: false });
}

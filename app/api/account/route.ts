import { NextResponse } from "next/server";
import { getAccount, toPublic } from "@/app/lib/auth/accounts";
import { getSessionEmail } from "@/app/lib/auth/session";

/** Who am I, and what's in my wallet? */
export async function GET() {
  const email = await getSessionEmail();
  const account = email ? getAccount(email) : null;
  if (!account) return NextResponse.json({ signedIn: false });
  return NextResponse.json(toPublic(account));
}

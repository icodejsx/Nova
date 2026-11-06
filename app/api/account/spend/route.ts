import { NextResponse, type NextRequest } from "next/server";
import { spend, toPublic } from "@/app/lib/auth/accounts";
import { getSessionEmail } from "@/app/lib/auth/session";

/** Place a trade: debit the stake from the signed-in user's balance. */
export async function POST(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Sign in to trade." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    amount?: number;
    label?: string;
  } | null;

  const label = (body?.label ?? "Market trade").toString().slice(0, 80);
  const result = spend(email, Number(body?.amount), { type: "bet", label });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(toPublic(result.account));
}

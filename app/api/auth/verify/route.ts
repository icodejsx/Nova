import { NextResponse, type NextRequest } from "next/server";
import {
  checkOtp,
  getOrCreateAccount,
  isValidEmail,
  normalizeEmail,
  toPublic,
} from "@/app/lib/auth/accounts";
import { startSession } from "@/app/lib/auth/session";

/** Step 2 of sign-in: verify the code, create the account if new, start a session. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    code?: string;
  } | null;
  const email = normalizeEmail(body?.email ?? "");
  const code = (body?.code ?? "").trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }
  if (!checkOtp(email, code)) {
    return NextResponse.json(
      { error: "That code is wrong or has expired." },
      { status: 401 }
    );
  }

  const account = getOrCreateAccount(email);
  await startSession(account.email);
  return NextResponse.json(toPublic(account));
}

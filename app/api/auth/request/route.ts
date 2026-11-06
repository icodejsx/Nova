import { NextResponse, type NextRequest } from "next/server";
import {
  isValidEmail,
  issueOtp,
  normalizeEmail,
} from "@/app/lib/auth/accounts";
import { sendOtpEmail } from "@/app/lib/auth/mail";
import { isMockMode } from "@/app/lib/roqqu/server";

/**
 * Step 1 of sign-in: email a one-time code.
 *
 * Sandbox mode (no live Roqqu key) returns the code in the response so the
 * flow works without an email provider. With live Roqqu, a real email provider
 * is required — we never expose codes where real money can move.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const issued = issueOtp(email);
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error }, { status: 429 });
  }

  const mail = await sendOtpEmail(email, issued.code);
  if (mail.ok) return NextResponse.json({ sent: true });

  if (isMockMode()) {
    return NextResponse.json({ sent: true, sandbox: true, devCode: issued.code });
  }
  return NextResponse.json(
    { error: "Email delivery isn't configured. Try again later." },
    { status: 503 }
  );
}

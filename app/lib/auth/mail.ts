/**
 * Sign-in code email — SERVER ONLY.
 *
 * Uses Resend (https://resend.com) when RESEND_API_KEY is set.
 *   RESEND_API_KEY      Resend secret key
 *   AUTH_FROM_EMAIL     verified sender, e.g. "Nova <login@yourdomain.com>"
 */
export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_FROM_EMAIL);
}

export async function sendOtpEmail(
  to: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mailConfigured()) return { ok: false, error: "not-configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.AUTH_FROM_EMAIL,
        to,
        subject: `${code} is your Nova sign-in code`,
        text: `Your Nova sign-in code is ${code}. It expires in 10 minutes. If you didn't ask for it, ignore this email.`,
      }),
    });
    if (!res.ok) return { ok: false, error: `Email provider returned ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the email provider." };
  }
}

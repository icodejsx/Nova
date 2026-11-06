import { NextResponse, type NextRequest } from "next/server";
import {
  applyPaymentEvent,
  decryptWebhook,
  isMockMode,
  type PaymentLinkEvent,
} from "@/app/lib/roqqu/server";

/**
 * Roqqu payment-link webhook receiver.
 *
 * Live: body is `{ hash }` (aes-256-ctr), IV arrives in the `x-api-key` header.
 * Mock: when no Roqqu key is configured, a plaintext event is accepted so the
 * full funding flow can be demoed end-to-end ("Simulate payment" button).
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { hash?: string }
    | PaymentLinkEvent
    | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  let event: PaymentLinkEvent | null = null;

  if ("hash" in body && typeof body.hash === "string") {
    const iv = request.headers.get("x-api-key") ?? "";
    const decrypted = decryptWebhook(body.hash, iv);
    if (!decrypted || typeof decrypted !== "object") {
      return NextResponse.json({ error: "Could not decrypt webhook" }, { status: 401 });
    }
    event = decrypted as PaymentLinkEvent;
  } else if (isMockMode() && "event_type" in body) {
    event = body as PaymentLinkEvent;
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applied = applyPaymentEvent(event);
  // Always 200 for well-formed events so Roqqu doesn't keep retrying duplicates.
  return NextResponse.json({ received: true, applied });
}

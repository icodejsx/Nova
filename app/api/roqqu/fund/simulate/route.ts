import { NextResponse, type NextRequest } from "next/server";
import { simulatePaymentCompleted } from "@/app/lib/roqqu/server";

/**
 * Simulated checkout → fires the same code path as Roqqu's
 * `payment_link_completed` webhook. Only works for simulated sessions,
 * never for real Roqqu payment links.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { ref?: string } | null;
  if (!body?.ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  const session = simulatePaymentCompleted(body.ref);
  if (!session) {
    return NextResponse.json(
      { error: "Unknown or non-simulated payment" },
      { status: 404 }
    );
  }
  return NextResponse.json(session);
}

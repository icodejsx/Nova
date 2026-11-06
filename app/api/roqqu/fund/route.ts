import { NextResponse, type NextRequest } from "next/server";
import type { FundCurrency } from "@/app/lib/roqqu/types";
import {
  createPaymentLink,
  getPayment,
  getPrices,
  newReference,
} from "@/app/lib/roqqu/server";
import { registerPayment } from "@/app/lib/auth/accounts";
import { getSessionEmail } from "@/app/lib/auth/session";

const MIN_USD = 1;
const MAX_USD = 5_000;

/** Create a Roqqu payment link that funds the user's Nova balance. */
export async function POST(request: NextRequest) {
  // The payment is owned by the signed-in user; their email identifies them to Roqqu.
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Sign in to add funds." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    amount?: number;
    currency?: string;
    firstName?: string;
    lastName?: string;
  } | null;

  const amount = Number(body?.amount);
  const currency: FundCurrency = body?.currency === "usd" ? "usd" : "ngn";
  const firstName = (body?.firstName ?? "").trim() || "Nova";
  const lastName = (body?.lastName ?? "").trim() || "Trader";

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter an amount greater than zero." }, { status: 400 });
  }

  const prices = await getPrices();
  const creditUsd =
    currency === "usd" ? amount : Math.floor((amount / prices.ngnPerUsd) * 100) / 100;

  if (creditUsd < MIN_USD || creditUsd > MAX_USD) {
    return NextResponse.json(
      { error: `Amount must be between $${MIN_USD} and $${MAX_USD} USD equivalent.` },
      { status: 400 }
    );
  }

  const reference = newReference();
  registerPayment(reference, email);
  const session = await createPaymentLink({
    reference,
    amount,
    currency,
    creditUsd,
    email,
    firstName,
    lastName,
    origin: request.nextUrl.origin,
  });
  return NextResponse.json(session);
}

/** Poll a payment's status (client credits the balance once it flips to completed). */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  const payment = getPayment(ref);
  if (!payment) return NextResponse.json({ status: "unknown" }, { status: 404 });
  return NextResponse.json(payment);
}

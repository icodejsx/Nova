import { NextResponse, type NextRequest } from "next/server";
import type { WithdrawNetwork } from "@/app/lib/roqqu/types";
import { getSend, quoteSend, sendCoin } from "@/app/lib/roqqu/server";
import { getAccount, refund, spend } from "@/app/lib/auth/accounts";
import { getSessionEmail } from "@/app/lib/auth/session";

/**
 * Cash out: debit the signed-in user's balance, then queue a USDT send via
 * Roqqu `POST /wallets/send`. If Roqqu rejects the send, the debit is returned.
 */
export async function POST(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email || !getAccount(email)) {
    return NextResponse.json({ error: "Sign in to cash out." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    amount?: number;
    network?: string;
    to?: string;
  } | null;

  const network: WithdrawNetwork = body?.network === "bep20" ? "bep20" : "trc20";
  const amount = Number(body?.amount);
  const to = (body?.to ?? "").trim();

  const debit = spend(email, amount, {
    type: "withdraw",
    label: `Cash out → ${network.toUpperCase()} ${to.slice(0, 6)}…`,
  });
  if (!debit.ok) {
    return NextResponse.json({ error: debit.error }, { status: 400 });
  }

  const result = await sendCoin({ amount, network, to, token: "usdt" });
  if (!result.ok) {
    refund(email, amount, "Cash out refunded");
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.record);
}

/**
 * GET ?refid=…            → send status (poll until completed + txHash)
 * GET ?quote=<amount>      → fee preview
 */
export async function GET(request: NextRequest) {
  const quote = request.nextUrl.searchParams.get("quote");
  if (quote !== null) {
    const amount = Number(quote);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    return NextResponse.json(quoteSend(amount));
  }

  const refid = request.nextUrl.searchParams.get("refid");
  if (!refid) return NextResponse.json({ error: "Missing refid" }, { status: 400 });
  const record = await getSend(refid);
  if (!record) return NextResponse.json({ error: "refid details not found" }, { status: 404 });
  return NextResponse.json(record);
}

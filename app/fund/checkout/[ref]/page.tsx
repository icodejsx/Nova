"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { FundSession } from "@/app/lib/roqqu/types";

const NETWORK_LABEL: Record<string, string> = {
  trc20: "USDT · Tron (TRC20)",
  bep20: "USDT · BNB Smart Chain (BEP20)",
  bitcoin: "Bitcoin (BTC)",
};

function money(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/**
 * Simulated Roqqu hosted payment-link page. Mirrors what the real
 * `payment.roqqu.com/<refid>` flow does: show deposit addresses, wait for the
 * payment, then redirect back to the merchant (Nova) with ?status=success.
 */
export default function SimulatedCheckout({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = use(params);
  const [session, setSession] = useState<FundSession | null>(null);
  const [missing, setMissing] = useState(false);
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<"idle" | "confirming" | "done">("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/roqqu/fund?ref=${encodeURIComponent(ref)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return (await r.json()) as FundSession;
      })
      .then((s) => {
        if (cancelled) return;
        setSession(s);
        if (s.status === "completed") setPhase("done");
      })
      .catch(() => !cancelled && setMissing(true));
    return () => {
      cancelled = true;
    };
  }, [ref]);

  async function pay() {
    setPhase("confirming");
    // Simulate blockchain confirmation time.
    await new Promise((r) => setTimeout(r, 2500));
    const res = await fetch("/api/roqqu/fund/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref }),
    });
    if (res.ok) {
      setPhase("done");
    } else {
      setPhase("idle");
    }
  }

  const wallet = session?.wallets?.[active];

  return (
    <main className="min-h-screen bg-[#0b0b10] text-white grid place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#13131a] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-[#5b5bf0] grid place-items-center text-sm font-bold">
              R
            </span>
            <span className="font-semibold tracking-tight">Roqqu Pay</span>
          </div>
          <span className="text-[10px] font-mono rounded-full border border-amber-400/40 text-amber-300 px-2 py-0.5">
            SIMULATION
          </span>
        </div>

        {missing ? (
          <div className="p-8 text-center text-sm text-white/60">
            This payment link was not found or has expired.
            <div className="mt-4">
              <Link href="/fund" className="text-[#8b8bff] hover:underline">
                Back to Nova
              </Link>
            </div>
          </div>
        ) : !session ? (
          <div className="p-8 h-48 animate-pulse" />
        ) : phase === "done" ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-400 grid place-items-center text-2xl">
              ✓
            </div>
            <h1 className="text-lg font-semibold mb-1">Payment received</h1>
            <p className="text-sm text-white/60 mb-6">
              Roqqu has notified Nova. Your balance is being credited.
            </p>
            <Link
              href={`/fund?status=success&ref=${ref}`}
              className="inline-block px-6 py-3 rounded-lg bg-[#5b5bf0] hover:bg-[#6c6cff] text-sm font-semibold transition-colors"
            >
              Return to Nova
            </Link>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
                Pay Nova Markets
              </div>
              <div className="text-3xl font-semibold font-mono">
                {session.currency === "ngn" ? "₦" : "$"}
                {money(session.amount, session.currency === "ngn" ? 0 : 2)}
              </div>
              <div className="text-xs text-white/40 mt-1">
                Ref <span className="font-mono">{session.reference}</span>
              </div>
            </div>

            {session.wallets && session.wallets.length > 0 ? (
              <div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {session.wallets.map((w, i) => (
                    <button
                      key={w.network}
                      type="button"
                      onClick={() => setActive(i)}
                      className={`rounded-lg border px-2 py-2 text-[11px] transition-colors ${
                        active === i
                          ? "border-[#5b5bf0] bg-[#5b5bf0]/15 text-white"
                          : "border-white/10 text-white/50 hover:border-white/25"
                      }`}
                    >
                      {w.token} · {w.network.toUpperCase()}
                    </button>
                  ))}
                </div>
                {wallet ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-[11px] text-white/40 mb-2">
                      Send {NETWORK_LABEL[wallet.network]} to
                    </div>
                    <div className="font-mono text-xs break-all text-white/90">
                      {wallet.address}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(wallet.address);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        } catch {
                          /* ignore */
                        }
                      }}
                      className="mt-3 text-[11px] text-[#8b8bff] hover:underline"
                    >
                      {copied ? "Copied" : "Copy address"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void pay()}
              disabled={phase === "confirming"}
              className="w-full py-3.5 rounded-lg bg-[#5b5bf0] hover:bg-[#6c6cff] text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {phase === "confirming"
                ? "Waiting for blockchain confirmation…"
                : "I've sent the payment (simulate)"}
            </button>
            <p className="text-[11px] text-white/35 leading-relaxed">
              Simulation of Roqqu&apos;s hosted payment-link page. No real funds
              move. Clicking the button above triggers the same server path as
              Roqqu&apos;s <span className="font-mono">payment_link_completed</span>{" "}
              webhook.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

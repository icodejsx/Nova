"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useAccount } from "@/app/hooks/useCredit";
import { useRoqquPrices } from "@/app/hooks/useRoqquPrices";
import { refreshAccount, signOut } from "@/app/lib/account-client";
import type {
  FundCurrency,
  FundSession,
  RoqquWallet,
  WithdrawNetwork,
  WithdrawRecord,
} from "@/app/lib/roqqu/types";

const INPUT =
  "w-full bg-background border border-border-strong rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-muted transition-colors";

const QUICK: Record<FundCurrency, number[]> = {
  ngn: [5_000, 15_000, 50_000],
  usd: [10, 50, 100],
};

function money(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function timeAgo(at: number) {
  const s = Math.max(1, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ------------------------------------------------------------------ */
/* Cash out (Roqqu POST /wallets/send)                                  */
/* ------------------------------------------------------------------ */

function WithdrawCard({ balance }: { balance: number }) {
  const [network, setNetwork] = useState<WithdrawNetwork>("trc20");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [record, setRecord] = useState<WithdrawRecord | null>(null);
  const pollRef = useRef<number | null>(null);

  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric >= 5;
  const fee = valid ? Math.round(numeric) / 100 : 0;
  const net = valid ? Math.round((numeric - fee) * 100) / 100 : 0;

  const stop = useCallback(() => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  async function submit() {
    setError("");
    if (!valid) return setError("Minimum cash out is $5.");
    if (numeric > balance) {
      return setError(`Insufficient balance ($${money(balance)}).`);
    }
    setBusy(true);
    try {
      const res = await fetch("/api/roqqu/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numeric, network, to }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          typeof json.error === "string" ? json.error : "Cash out failed."
        );
        return;
      }
      const rec = json as WithdrawRecord;
      // The server already debited the balance; pull the new balance and ledger.
      void refreshAccount();
      setRecord(rec);
      stop();
      pollRef.current = window.setInterval(async () => {
        try {
          const r = await fetch(
            `/api/roqqu/send?refid=${encodeURIComponent(rec.refid)}`
          );
          if (!r.ok) return;
          const next = (await r.json()) as WithdrawRecord;
          setRecord(next);
          if (next.status !== "queued") stop();
        } catch {
          /* retry */
        }
      }, 3000);
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="text-xs font-medium text-accent mb-1">
            Cash out
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Withdraw winnings in USDT
          </h2>
          <p className="text-xs text-muted mt-1 max-w-md leading-relaxed">
            Send your Nova balance to any USDT address through Roqqu. A 1% network
            fee is taken from the amount sent.
          </p>
        </div>
      </div>

      {record ? (
        <div className="rounded-xl border border-border-strong bg-background/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span
              className={`font-mono-nums text-[10px] px-2 py-1 rounded-full ${
                record.status === "completed"
                  ? "text-yes bg-yes-bg"
                  : "text-amber-400 bg-amber-500/10"
              }`}
            >
              {record.status === "completed" ? "SENT ON-CHAIN" : "QUEUED AT ROQQU"}
            </span>
            <span className="font-mono-nums text-[10px] text-muted">
              {record.source === "mock" ? "SIMULATED" : "LIVE"}
            </span>
          </div>
          <dl className="space-y-1.5 text-xs">
            <Row k="Recipient gets" v={`${money(record.net)} USDT`} />
            <Row k="Fee" v={`${money(record.fee)} USDT`} />
            <Row k="Network" v={record.network.toUpperCase()} />
            <Row k="To" v={`${record.to.slice(0, 8)}…${record.to.slice(-6)}`} />
            <Row k="Roqqu refid" v={record.refid} />
            {record.txHash ? (
              <Row k="Tx hash" v={`${record.txHash.slice(0, 10)}…${record.txHash.slice(-8)}`} />
            ) : null}
          </dl>
          {record.status === "queued" ? (
            <p className="text-[11px] text-muted">
              Waiting for network confirmation (Roqqu&apos;s{" "}
              <span className="font-mono-nums">token_sent</span> webhook)…
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setRecord(null);
              setAmount("");
              setTo("");
            }}
            className="text-xs text-accent hover:underline rounded focus-ring"
          >
            New cash out
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {(["trc20", "bep20"] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNetwork(n)}
                aria-pressed={network === n}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors focus-ring ${
                  network === n
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border-strong text-dim hover:border-muted"
                }`}
              >
                {n === "trc20" ? "USDT · Tron" : "USDT · BNB Chain"}
              </button>
            ))}
          </div>
          <input
            aria-label="Destination address"
            value={to}
            onChange={(e) => setTo(e.target.value.trim())}
            placeholder={network === "trc20" ? "T… (Tron address)" : "0x… (BNB Chain address)"}
            className={`${INPUT} font-mono-nums`}
            spellCheck={false}
          />
          <div>
            <div className="relative">
              <input
                aria-label="Amount in USD"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="Amount (min 5)"
                className={`${INPUT} font-mono-nums pr-24`}
              />
              <button
                type="button"
                onClick={() => setAmount(String(Math.floor(balance * 100) / 100))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono-nums text-accent hover:underline rounded focus-ring"
              >
                MAX · ${money(balance)}
              </button>
            </div>
            {valid ? (
              <p className="text-xs text-muted mt-2">
                Fee <span className="font-mono-nums">${money(fee)}</span> · recipient gets{" "}
                <span className="font-mono-nums text-accent">{money(net)} USDT</span>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !to || !amount}
            className="w-full py-3.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            {busy ? "Sending to Roqqu…" : "Cash out with Roqqu"}
          </button>
          {error ? (
            <div className="text-xs text-no" role="alert">
              {error}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="font-mono-nums text-dim text-right break-all">{v}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

function FundContent() {
  const {
    balance: credit,
    entries,
    walletId,
    email,
    signedIn,
    loaded,
  } = useAccount();
  const prices = useRoqquPrices();
  const searchParams = useSearchParams();

  const [currency, setCurrency] = useState<FundCurrency>("ngn");
  const [amount, setAmount] = useState("15000");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [session, setSession] = useState<FundSession | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wallet, setWallet] = useState<RoqquWallet | null>(null);
  const pollRef = useRef<number | null>(null);

  const numeric = Number(amount);
  const ngnPerUsd = prices?.ngnPerUsd ?? 1500;
  const quoteUsd =
    Number.isFinite(numeric) && numeric > 0
      ? currency === "usd"
        ? numeric
        : Math.floor((numeric / ngnPerUsd) * 100) / 100
      : 0;

  const stopPolling = useCallback(() => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const checkStatus = useCallback(
    async (reference: string) => {
      try {
        const res = await fetch(`/api/roqqu/fund?ref=${encodeURIComponent(reference)}`);
        if (!res.ok) return;
        const next = (await res.json()) as FundSession;
        if (next.status === "completed") {
          stopPolling();
          // Roqqu's webhook credited the account on the server; pull the new balance.
          void refreshAccount();
          setSession(next);
        } else if (next.status === "failed") {
          stopPolling();
          setSession(next);
        }
      } catch {
        /* retry on next tick */
      }
    },
    [stopPolling]
  );

  // Returning from checkout: ?status=success&ref=…
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && searchParams.get("status") === "success") {
      const first = window.setTimeout(() => void checkStatus(ref), 0);
      pollRef.current = window.setInterval(() => void checkStatus(ref), 3000);
      return () => {
        window.clearTimeout(first);
        stopPolling();
      };
    }
    return stopPolling;
  }, [searchParams, checkStatus, stopPolling]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/roqqu/wallet")
      .then((r) => r.json())
      .then((w: RoqquWallet) => {
        if (!cancelled) setWallet(w);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function startFunding() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/roqqu/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numeric, currency, firstName, lastName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not start funding.");
        return;
      }
      const next = json as FundSession;
      setSession(next);
      if (next.paymentLink) {
        window.open(next.paymentLink, "_blank", "noopener,noreferrer");
        stopPolling();
        pollRef.current = window.setInterval(
          () => void checkStatus(next.reference),
          3000
        );
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = quoteUsd >= 1 && !busy;
  const completed = session?.status === "completed";

  if (!loaded) {
    return <div className="max-w-5xl mx-auto px-6 py-24" aria-busy />;
  }
  if (!signedIn) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Sign in to your Roqqu wallet
        </h1>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          Your balance and activity are saved to your account, so you can pick
          up where you left off on any device.
        </p>
        <Link
          href="/signin?next=/fund"
          className="inline-block px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-sm font-semibold transition-colors focus-ring"
        >
          Sign in with your email
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-24">
      <Link href="/" className="text-[13px] text-muted hover:text-dim transition-colors rounded focus-ring">
        ← Back to markets
      </Link>

      <div className="mt-5 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Your Roqqu wallet
          </h1>
          <p className="text-sm text-muted mt-2 max-w-xl leading-relaxed">
            Add money with naira, USDT or Bitcoin through a Roqqu payment link.
            When Roqqu confirms the payment your balance updates automatically,
            and you can cash winnings out to USDT any time.
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface px-5 py-3 text-right">
          <div className="text-xs text-muted">Wallet balance</div>
          <div className="font-mono-nums text-2xl font-semibold text-accent">
            ${money(credit)}
          </div>
          <div className="font-mono-nums text-xs text-muted mt-1">
            Wallet ID {walletId}
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-1 text-[10px] text-muted hover:text-foreground underline underline-offset-2 rounded focus-ring"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        <div className="space-y-6 min-w-0">
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 grid gap-6">
            {completed ? (
              <div className="rounded-xl border border-yes/40 bg-yes-bg/40 p-6 text-center">
                <div className="text-xs font-medium text-yes mb-2">
                  Payment confirmed by Roqqu
                </div>
                <h2 className="text-xl font-semibold text-yes mb-1">
                  +${money(session?.creditUsd ?? 0)} added
                </h2>
                <p className="text-sm text-dim mb-5">
                  Reference <span className="font-mono-nums">{session?.reference}</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/"
                    className="px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-sm font-semibold transition-colors focus-ring"
                  >
                    Start trading
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSession(null)}
                    className="px-6 py-3 rounded-lg border border-border-strong text-sm text-dim hover:text-foreground transition-colors focus-ring"
                  >
                    Add more
                  </button>
                </div>
              </div>
            ) : session ? (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
                <div className="text-xs font-medium text-accent mb-2">
                  {session.status === "failed" ? "Payment failed" : "Waiting for payment"}
                </div>
                <p className="text-sm text-dim mb-1">
                  {session.currency === "ngn" ? "₦" : "$"}
                  {money(session.amount, session.currency === "ngn" ? 0 : 2)} →{" "}
                  <span className="text-foreground">${money(session.creditUsd)}</span> Nova balance
                </p>
                <p className="text-xs text-muted mb-4">
                  Reference <span className="font-mono-nums">{session.reference}</span>
                </p>
                {session.paymentLink ? (
                  <a
                    href={session.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-sm font-semibold transition-colors focus-ring"
                  >
                    {session.source === "mock"
                      ? "Open Roqqu checkout (simulated) ↗"
                      : "Open Roqqu checkout ↗"}
                  </a>
                ) : null}
                {session.note ? (
                  <p className="text-[11px] text-amber-400 mt-3">{session.note}</p>
                ) : null}
                <p className="text-[11px] text-muted mt-3">
                  Checking for Roqqu&apos;s confirmation every few seconds…
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="text-[13px] font-medium text-foreground/80 mb-2">Currency</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["ngn", "usd"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCurrency(c);
                          setAmount(String(QUICK[c][1]));
                        }}
                        aria-pressed={currency === c}
                        className={`rounded-xl border px-3 py-2.5 text-sm transition-colors focus-ring ${
                          currency === c
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border-strong text-dim hover:border-muted"
                        }`}
                      >
                        {c === "ngn" ? "Naira (₦)" : "US Dollar ($)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="fund-amount" className="block text-[13px] font-medium text-foreground/80 mb-2">
                    Amount
                  </label>
                  <input
                    id="fund-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                    className={`${INPUT} font-mono-nums`}
                  />
                  <div className="flex gap-1.5 mt-2">
                    {QUICK[currency].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setAmount(String(q))}
                        className="flex-1 py-1.5 rounded-md border border-border-subtle text-[11px] font-mono-nums text-muted hover:text-foreground hover:border-border-strong transition-colors focus-ring"
                      >
                        {currency === "ngn" ? "₦" : "$"}
                        {q.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-2">
                    You receive{" "}
                    <span className="font-mono-nums text-accent">${money(quoteUsd)}</span> Nova
                    balance
                    {currency === "ngn" ? <> at ₦{money(ngnPerUsd, 0)}/$</> : null}
                    {prices?.source === "mock" ? " (simulated rate)" : ""}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 rounded-lg border border-border-subtle bg-background/60 px-3.5 py-3 text-[13px] text-muted">
                    Paying as{" "}
                    <span className="text-foreground font-medium">{email}</span>
                  </div>
                  <input
                    aria-label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className={INPUT}
                  />
                  <input
                    aria-label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className={INPUT}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void startFunding()}
                  disabled={!canSubmit}
                  className="w-full py-3.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                >
                  {busy ? "Creating payment link…" : "Pay with Roqqu"}
                </button>
                {error ? (
                  <div className="text-xs text-no" role="alert">
                    {error}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <WithdrawCard balance={credit} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-border-subtle">
              <div className="text-xs font-medium text-muted">
                Your activity
              </div>
            </div>
            <div className="p-5">
              {entries.length === 0 ? (
                <p className="text-[11px] text-muted">
                  No activity yet. Fund your balance to start trading.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {entries.slice(0, 8).map((e) => (
                    <li key={e.id} className="flex items-start justify-between gap-3 text-[11px]">
                      <div className="min-w-0">
                        <div className="text-dim truncate">{e.label}</div>
                        <div className="text-[10px] text-muted">{timeAgo(e.at)}</div>
                      </div>
                      <span
                        className={`font-mono-nums shrink-0 ${
                          e.amountUsd > 0 ? "text-yes" : "text-dim"
                        }`}
                      >
                        {e.amountUsd > 0 ? "+" : "−"}${money(Math.abs(e.amountUsd))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-border-subtle flex items-center justify-between">
              <div className="text-xs font-medium text-muted">
                Roqqu treasury wallet
              </div>
              {wallet ? (
                <span className="font-mono-nums text-[9px] text-muted">
                  {wallet.source === "roqqu" ? "LIVE" : "SIMULATED"}
                </span>
              ) : null}
            </div>
            <div className="p-5 space-y-4">
              {!wallet ? (
                <div className="h-16 rounded-lg animate-shimmer" />
              ) : (
                <>
                  <dl className="grid grid-cols-2 gap-2">
                    {Object.entries(wallet.balances)
                      .filter(([, v]) => v > 0)
                      .slice(0, 6)
                      .map(([token, bal]) => (
                        <div key={token} className="rounded-lg bg-background/60 border border-border-subtle px-3 py-2">
                          <dt className="text-[10px] uppercase text-muted">{token}</dt>
                          <dd className="font-mono-nums text-sm">{bal}</dd>
                        </div>
                      ))}
                  </dl>
                  {wallet.history.length > 0 ? (
                    <ul className="space-y-1.5">
                      {wallet.history.slice(0, 4).map((h) => (
                        <li key={h.id} className="flex justify-between text-[11px]">
                          <span className="text-muted uppercase">
                            {h.direction} · {h.token}
                          </span>
                          <span
                            className={`font-mono-nums ${
                              h.direction === "credit" ? "text-yes" : "text-dim"
                            }`}
                          >
                            {h.direction === "credit" ? "+" : "−"}
                            {h.amount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {wallet.note ? (
                    <p className="text-[10px] text-muted">{wallet.note}</p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface p-5">
            <div className="text-xs font-medium text-muted mb-3">
              How it works
            </div>
            <ol className="space-y-2 text-xs text-dim list-decimal list-inside">
              <li>Nova creates a Roqqu payment link</li>
              <li>You pay in NGN, USDT or BTC</li>
              <li>Roqqu sends an encrypted webhook to Nova</li>
              <li>Your balance is credited and you trade</li>
              <li>Cash winnings out to USDT via Roqqu</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function FundPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Suspense fallback={<div className="max-w-5xl mx-auto px-6 py-10 h-64 animate-shimmer rounded-xl" />}>
        <FundContent />
      </Suspense>
    </main>
  );
}

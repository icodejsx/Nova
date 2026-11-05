"use client";

import { useState } from "react";
import { useWallet } from "@/app/providers";
import { ConnectWallet } from "@/app/components/ConnectWallet";
import { USE_DEMO } from "@/app/config/network";
import { redeemInvite } from "@/app/lib/access";
import type { MarketData } from "@/app/lib/types";

export function InviteGate({
  market,
  onUnlocked,
}: {
  market: MarketData;
  onUnlocked: () => void;
}) {
  const { address, isConnected } = useWallet();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function submit() {
    if (!address) {
      setError("Connect Freighter first.");
      return;
    }
    setPending(true);
    setError("");
    const result = redeemInvite(market, code, address);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUnlocked();
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
        <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden>
          <rect x="2.5" y="5.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M4 5.5V4a2 2 0 0 1 4 0v1.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold mb-1">Invite-only market</h2>
      <p className="text-xs text-muted mb-5 max-w-sm mx-auto leading-relaxed">
        This market is private. Enter the invite code from the creator to view
        odds and place bets.
      </p>

      {!isConnected ? (
        <div className="flex justify-center">
          <ConnectWallet />
        </div>
      ) : (
        <div className="max-w-xs mx-auto space-y-3">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="NOVA-XXXXXX"
            className="w-full bg-background border border-border-strong rounded-lg px-3.5 py-3 text-sm font-mono-nums text-center tracking-wider placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={submit}
            disabled={pending || code.trim().length < 4}
            className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            {pending ? "Checking…" : "Unlock market"}
          </button>
          {error ? (
            <p className="text-xs text-no" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}

      {market.inviteCode && USE_DEMO ? (
        <p className="mt-4 text-[10px] text-muted font-mono-nums">
          Demo hint: {market.inviteCode}
        </p>
      ) : null}
    </div>
  );
}

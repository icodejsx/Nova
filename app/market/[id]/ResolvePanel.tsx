"use client";

import { useState } from "react";
import { useWallet } from "@/app/providers";
import { LivePrice } from "@/app/components/LivePrice";

export function ResolvePanel({
  marketId,
  question,
  endTime,
  resolved,
  outcome,
  creator,
  onUpdate,
}: {
  marketId: string;
  question: string;
  endTime: bigint;
  resolved: boolean;
  outcome: boolean;
  creator?: string;
  onUpdate: () => void;
}) {
  const { address } = useWallet();
  const [busy, setBusy] = useState(false);
  const [localResolved, setLocalResolved] = useState(resolved);
  const [localOutcome, setLocalOutcome] = useState(outcome);
  const [claimed, setClaimed] = useState(false);

  // eslint-disable-next-line react-hooks/purity
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const ended = endTime > BigInt(0) && nowSec >= endTime;
  const isOwner =
    address && creator && address.toLowerCase() === creator.toLowerCase();

  if (!ended && !localResolved) return null;

  function resolveMarket(result: boolean) {
    void marketId;
    setBusy(true);
    window.setTimeout(() => {
      setLocalResolved(true);
      setLocalOutcome(result);
      setBusy(false);
      onUpdate();
    }, 500);
  }

  function claimWinnings() {
    setBusy(true);
    window.setTimeout(() => {
      setClaimed(true);
      setBusy(false);
      onUpdate();
    }, 500);
  }

  return (
    <section className="mt-4 rounded-xl border border-border-subtle bg-surface p-5">
      {localResolved ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Settlement</h2>
            <span
              className={`font-mono-nums text-[10px] px-2 py-1 rounded-full ${
                localOutcome ? "text-yes bg-yes-bg" : "text-no bg-no-bg"
              }`}
            >
              {localOutcome ? "YES WON" : "NO WON"}
            </span>
          </div>

          {!claimed ? (
            <>
              <p className="text-xs text-dim mb-4">
                If your position won, claim your payout (net of 2% fee) from the
                registry contract.
              </p>
              <button
                type="button"
                onClick={claimWinnings}
                disabled={busy || !address}
                className="w-full py-3 rounded-lg bg-yes hover:bg-yes/90 text-white text-[13px] font-semibold transition-colors disabled:opacity-50 focus-ring"
              >
                {busy ? "Confirming…" : "Claim winnings"}
              </button>
            </>
          ) : (
            <div className="rounded-lg bg-yes-bg border border-yes/20 py-3 text-center text-xs text-yes">
              Claim flow stubbed · wire after Testnet deploy
            </div>
          )}
        </>
      ) : isOwner ? (
        <>
          <div className="font-mono-nums text-[10px] tracking-wider text-amber-400 mb-2">
            OWNER ACTION REQUIRED
          </div>
          <h2 className="text-sm font-medium mb-2">Resolve this market</h2>
          <p className="text-xs leading-relaxed text-muted mb-4">
            Resolution is final and determines every payout. Verify the result
            from a reliable source before choosing an outcome.
          </p>
          <div className="mb-4">
            <LivePrice question={question} label="Price evidence" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => resolveMarket(true)}
              disabled={busy}
              className="py-3 rounded-lg bg-yes hover:bg-yes/90 text-white text-xs font-semibold transition-colors disabled:opacity-50 focus-ring"
            >
              Resolve YES
            </button>
            <button
              type="button"
              onClick={() => resolveMarket(false)}
              disabled={busy}
              className="py-3 rounded-lg bg-no hover:bg-no/90 text-white text-xs font-semibold transition-colors disabled:opacity-50 focus-ring"
            >
              Resolve NO
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="font-mono-nums text-[10px] tracking-wider text-amber-400 mb-2">
            AWAITING RESOLUTION
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Betting is closed. The market creator must submit the final outcome
            before winning positions can claim.
          </p>
        </>
      )}
    </section>
  );
}

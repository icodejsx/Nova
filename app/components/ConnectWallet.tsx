"use client";

import { useState } from "react";
import { useWallet } from "@/app/providers";

export function ConnectWallet() {
  const { address, isConnected, isPending, connect, disconnect, error } =
    useWallet();
  const [hint, setHint] = useState(false);

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="font-mono-nums text-[11px] px-3 py-1.5 rounded-lg border border-border-strong text-dim hover:text-foreground hover:border-muted transition-colors focus-ring"
      >
        {address.slice(0, 4).toUpperCase()}…{address.slice(-4).toUpperCase()}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={async () => {
          setHint(false);
          await connect();
          setHint(true);
        }}
        disabled={isPending}
        className="text-[11px] px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg font-semibold transition-colors disabled:opacity-50 focus-ring"
      >
        {isPending ? "Connecting…" : "Connect"}
      </button>
      {(error || hint) && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border-strong bg-surface p-3 text-[11px] text-muted shadow-xl">
          {error ??
            "Need Freighter? Install the browser extension and switch to Testnet."}
        </div>
      )}
    </div>
  );
}

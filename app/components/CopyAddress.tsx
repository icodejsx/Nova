"use client";

import { useState } from "react";

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="font-mono-nums text-[11px] text-dim hover:text-foreground transition-colors focus-ring rounded"
      aria-label="Copy contract address"
    >
      {copied
        ? "COPIED"
        : `${address.slice(0, 8)}…${address.slice(-6)}  ⧉`}
    </button>
  );
}

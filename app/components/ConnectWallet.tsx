"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCredit } from "@/app/hooks/useCredit";
import { useWallet } from "@/app/providers";

/** "Sign in" when signed out; the balance (linking to the wallet page) when signed in. */
export function ConnectWallet() {
  const { address, isConnected, isLoading } = useWallet();
  const balance = useCredit();
  const pathname = usePathname();

  if (isLoading) {
    return <span className="inline-block h-[34px] w-24 rounded-lg animate-shimmer" aria-hidden />;
  }

  if (!isConnected) {
    const next = pathname && pathname !== "/signin" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link
        href={`/signin${next}`}
        className="inline-flex items-center text-sm px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg font-semibold transition-colors focus-ring"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/fund"
      title={`Wallet ${address}`}
      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-border-strong hover:border-muted transition-colors focus-ring"
    >
      <span className="font-mono-nums font-semibold text-foreground">
        ${balance.toFixed(2)}
      </span>
      <span className="text-accent">Add funds</span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useIsCreator } from "@/app/hooks/useIsCreator";
import { useCredit } from "@/app/hooks/useCredit";
import { ConnectWallet } from "./ConnectWallet";
import { Logo } from "./Logo";

export function SiteHeader({ breadcrumb }: { breadcrumb?: ReactNode }) {
  const { isCreator } = useIsCreator();
  const credit = useCredit();
  const pathname = usePathname();
  const onMarkets = pathname === "/" || pathname.startsWith("/market");

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-background/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <Logo className="shrink-0" />

          {breadcrumb ?? (
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/"
                aria-current={onMarkets ? "page" : undefined}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors focus-ring ${
                  onMarkets
                    ? "bg-white/5 text-foreground"
                    : "text-muted hover:text-dim"
                }`}
              >
                Markets
              </Link>
              <Link
                href="/#overview"
                className="text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-dim transition-colors focus-ring"
              >
                Overview
              </Link>
              <Link
                href="/#pulse"
                className="text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-dim transition-colors focus-ring"
              >
                News
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/5 px-2.5 py-1 font-mono-nums text-[10px] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Testnet
          </span>
          <Link
            href="/fund"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-2.5 py-1.5 font-mono-nums text-[11px] text-accent hover:bg-accent/10 transition-colors focus-ring"
            title="Fund your balance with Roqqu"
          >
            ${credit.toFixed(2)}
            <span className="text-[10px] text-muted">+ Add</span>
          </Link>
          {isCreator && (
            <Link
              href="/create"
              className="text-xs px-3 py-1.5 rounded-lg border border-border-strong text-dim hover:text-foreground hover:border-muted transition-colors focus-ring"
            >
              Create
            </Link>
          )}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
